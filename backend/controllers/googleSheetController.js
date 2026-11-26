
const GoogleSheet = require("../models/GoogleSheet");
const GoogleSheetConnection = require("../models/GoogleSheetConnection");
const Lead = require("../models/Lead");

const crypto = require("crypto");
const mongoose = require("mongoose");
const { google } = require("googleapis");

const { getGoogleOAuthClient } = require("../services/googleOAuthService");

const ALGORITHM = "aes-256-gcm";

// Only Sales Manager can use these controller functions
const checkSalesManager = (req, res) => {
  if (!req.user || req.user.role !== "sales_manager") {
    res.status(403).json({
      success: false,
      message: "Only Sales Manager can access Google Sheets."
    });
    return false;
  }

  if (!req.user.companyId) {
    res.status(400).json({
      success: false,
      message: "Company information is missing."
    });
    return false;
  }

  return true;
};

// Decrypt Google Refresh Token
const decryptToken = (encryptedData) => {
  const encryptionKey = Buffer.from(
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "",
    "hex"
  );

  if (encryptionKey.length !== 32) {
    throw new Error("Invalid Google token encryption key.");
  }

  if (!encryptedData || typeof encryptedData !== "string") {
    throw new Error("Encrypted Google token is missing.");
  }

  const [ivHex, authTagHex, encryptedText] =
    encryptedData.split(":");

  if (!ivHex || !authTagHex || !encryptedText) {
    throw new Error("Invalid encrypted token format.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    encryptionKey,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(
    encryptedText,
    "hex",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
};

// Get Company's Google Client
const getCompanyGoogleClient = async (companyId) => {
  const connection = await GoogleSheetConnection.findOne({
    companyId,
    status: "connected"
  }).select("+refreshTokenEncrypted");

  if (!connection) {
    throw new Error(
      "This spreadsheet is not publicly accessible. Please connect your Google account or make the sheet public."
    );
  }

  const refreshToken = decryptToken(
    connection.refreshTokenEncrypted
  );

  const oauth2Client = getGoogleOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  return oauth2Client;
};

// Extract Spreadsheet ID safely
const extractSpreadsheetId = (url) => {
  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "docs.google.com" ||
      !parsedUrl.pathname.startsWith("/spreadsheets/d/")
    ) {
      return null;
    }

    const match = parsedUrl.pathname.match(
      /^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/
    );

    return match ? match[1] : null;

  } catch {
    return null;
  }
};

// CSV Parser - supports quoted values and commas
const parseCSV = (csvText) => {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !insideQuotes
    ) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }

      row.push(value);

      if (row.some(cell => cell.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);

  if (row.some(cell => cell.trim() !== "")) {
    rows.push(row);
  }

  if (rows.length > 0 && rows[0][0]) {
    rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
  }

  return rows;
};

// Fetch Public Google Sheet as CSV
const getPublicSheetRows = async (spreadsheetId, sheetName) => {
  const csvUrl =
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(csvUrl, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
    headers: {
      Accept: "text/csv,text/plain"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Public Google Sheet request failed (${response.status}).`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (
    !text.trim() ||
    text.trim().startsWith("<!DOCTYPE") ||
    text.trim().startsWith("<html") ||
    contentType.includes("text/html")
  ) {
    throw new Error(
      "Google Sheet is not publicly accessible or the requested tab was not found."
    );
  }

  return parseCSV(text);
};

// Fetch Sheet Rows: Public First, OAuth Fallback
const getSheetRows = async (savedSheet, companyId) => {
  try {
    return await getPublicSheetRows(
      savedSheet.spreadsheetId,
      savedSheet.sheetName
    );
  } catch (publicError) {
    console.log(
      "Public Sheet access unavailable. Trying Google OAuth..."
    );

    try {
      const oauth2Client = await getCompanyGoogleClient(companyId);

      const sheetsApi = google.sheets({
        version: "v4",
        auth: oauth2Client
      });

      const range =
        `'${savedSheet.sheetName.replace(/'/g, "''")}'!A:ZZ`;

      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: savedSheet.spreadsheetId,
        range
      });

      return response.data.values || [];

    } catch (oauthError) {
      console.error("Public Sheet Error:", publicError.message);
      console.error("OAuth Sheet Error:", oauthError.message);

      throw new Error(
        "Unable to access this Google Sheet. Make it public with Viewer access or connect the Google Account that has permission to view it."
      );
    }
  }
};

// Add Google Sheet
const addGoogleSheet = async (req, res) => {
  try {
    if (!checkSalesManager(req, res)) return;

    const { spreadsheetUrl, sheetName } = req.body;

    if (
      typeof spreadsheetUrl !== "string" ||
      typeof sheetName !== "string" ||
      !spreadsheetUrl.trim() ||
      !sheetName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Google Sheet URL and tab name are required."
      });
    }

    const cleanUrl = spreadsheetUrl.trim();
    const cleanSheetName = sheetName.trim();

    const spreadsheetId = extractSpreadsheetId(cleanUrl);

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Google Sheets URL."
      });
    }

    let accessMethod = "public";

    // First try public CSV access
    try {
      await getPublicSheetRows(
        spreadsheetId,
        cleanSheetName
      );
    } catch (publicError) {
      // If not public, verify using connected OAuth account
      const oauth2Client = await getCompanyGoogleClient(
        req.user.companyId
      );

      const sheetsApi = google.sheets({
        version: "v4",
        auth: oauth2Client
      });

      const spreadsheetResponse =
        await sheetsApi.spreadsheets.get({
          spreadsheetId,
          fields: "spreadsheetId,properties.title,sheets.properties"
        });

      const availableTabs =
        spreadsheetResponse.data.sheets || [];

      const tabExists = availableTabs.some(
        tab => tab.properties.title === cleanSheetName
      );

      if (!tabExists) {
        return res.status(400).json({
          success: false,
          message: `Tab "${cleanSheetName}" does not exist in this spreadsheet.`,
          availableTabs: availableTabs.map(
            tab => tab.properties.title
          )
        });
      }

      accessMethod = "oauth";
    }

    const savedSheet = await GoogleSheet.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        spreadsheetId,
        sheetName: cleanSheetName
      },
      {
        $set: {
          addedBy: req.user.userId,
          spreadsheetUrl: cleanUrl,
          status: "active"
        }
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    return res.status(201).json({
      success: true,
      message: "Google Sheet added successfully.",
      accessMethod,
      sheet: savedSheet
    });

  } catch (error) {
    console.error("Add Google Sheet error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This Google Sheet and tab are already added."
      });
    }

    if (error.code === 403 || error.code === 404) {
      return res.status(403).json({
        success: false,
        message: "The connected Google account does not have access to this spreadsheet. Please check its sharing permissions."
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message ||
        "Unable to add Google Sheet."
    });
  }
};

// Get Saved Google Sheets
const getGoogleSheets = async (req, res) => {
  try {
    if (!checkSalesManager(req, res)) return;

    const sheets = await GoogleSheet.find({
      companyId: req.user.companyId
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sheets.length,
      sheets
    });

  } catch (error) {
    console.error("Get Google Sheets error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch Google Sheets."
    });
  }
};

// Preview Google Sheet
const previewGoogleSheet = async (req, res) => {
  try {
    if (!checkSalesManager(req, res)) return;

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google Sheet ID."
      });
    }

    const savedSheet = await GoogleSheet.findOne({
      _id: id,
      companyId: req.user.companyId,
      status: "active"
    });

    if (!savedSheet) {
      return res.status(404).json({
        success: false,
        message: "Google Sheet not found."
      });
    }

    const rows = await getSheetRows(
      savedSheet,
      req.user.companyId
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "This spreadsheet tab is empty.",
        headers: [],
        sampleRows: [],
        totalRows: 0
      });
    }

    const headers = rows[0].map(header =>
      String(header).trim()
    );

    const sampleRows = rows.slice(1, 6);

    return res.status(200).json({
      success: true,
      message: "Google Sheet data fetched successfully.",
      headers,
      sampleRows,
      totalRows: Math.max(rows.length - 1, 0)
    });

  } catch (error) {
    console.error("Google Sheet preview error:", error);

    return res.status(500).json({
      success: false,
      message: error.message ||
        "Unable to read Google Sheet data."
    });
  }
};

// Import Selected Leads from Google Sheet
const importGoogleSheetLeads = async (req, res) => {
  try {
    if (!checkSalesManager(req, res)) return;

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google Sheet ID."
      });
    }

    const savedSheet = await GoogleSheet.findOne({
      _id: id,
      companyId: req.user.companyId,
      status: "active"
    });

    if (!savedSheet) {
      return res.status(404).json({
        success: false,
        message: "Google Sheet not found."
      });
    }

    const rows = await getSheetRows(
      savedSheet,
      req.user.companyId
    );

    const batchId = crypto.randomUUID();
    const importTime = new Date();

    if (rows.length < 2) {
      savedSheet.latestImportBatchId = batchId;
      savedSheet.latestImportedAt = importTime;
      savedSheet.lastSyncedAt = importTime;

      await savedSheet.save();

      return res.status(200).json({
        success: true,
        message: "No new leads found. Latest import batch is empty.",
        batchId,
        imported: 0,
        duplicates: 0,
        skipped: 0,
        totalRows: 0
      });
    }

    const headers = rows[0].map(header =>
      String(header).trim()
    );

    const requiredHeaders = [
      "created_time",
      "what_are_you_looking_for?",
      "what_is_your_preferred_investment_budget?",
      "full_name",
      "phone_number",
      "email",
      "city"
    ];

    const missingHeaders = requiredHeaders.filter(
      header => !headers.includes(header)
    );

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required columns are missing from Google Sheet.",
        missingHeaders
      });
    }

    const columnIndexes = {};

    requiredHeaders.forEach(header => {
      columnIndexes[header] = headers.indexOf(header);
    });

    let imported = 0;
    let duplicates = 0;
    let skipped = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const leadData = {};

      requiredHeaders.forEach(header => {
        leadData[header] = String(
          row[columnIndexes[header]] ?? ""
        ).trim();
      });

      const fullName = leadData.full_name;
      const phone = leadData.phone_number;
      const email = leadData.email;

      // Skip completely empty rows
      if (!requiredHeaders.some(header => leadData[header])) {
        skipped++;
        continue;
      }

      // Skip dummy/test names
      if (/\b(dummy|test)\b/i.test(fullName)) {
        skipped++;
        continue;
      }

      const normalizedPhone = phone
        ? phone.replace(/\D/g, "")
        : null;

      const normalizedEmail = email
        ? email.toLowerCase().trim()
        : null;

      // Create stable fingerprint from all 7 source fields
      const fingerprint = crypto
        .createHash("sha256")
        .update(
          JSON.stringify(
            requiredHeaders.map(field => leadData[field])
          )
        )
        .digest("hex");

      const sourceRowId = `fingerprint:${fingerprint}`;

      // Check duplicate within this company only
      const duplicateConditions = [];

      if (normalizedPhone) {
        duplicateConditions.push({ normalizedPhone });
      }

      if (normalizedEmail) {
        duplicateConditions.push({ normalizedEmail });
      }

      duplicateConditions.push({ leadData });

      const existingLead = await Lead.findOne({
        companyId: req.user.companyId,
        $or: duplicateConditions
      }).select("_id");

      if (existingLead) {
        duplicates++;
        continue;
      }

      try {
        await Lead.create({
          companyId: req.user.companyId,
          googleSheetId: savedSheet._id,
          sourceRowId,
          importBatchId: batchId,
          importedAt: importTime,
          leadData,
          normalizedPhone,
          normalizedEmail
        });

        imported++;

      } catch (createError) {
        if (createError.code === 11000) {
          duplicates++;
          continue;
        }

        throw createError;
      }
    }

    savedSheet.latestImportBatchId = batchId;
    savedSheet.latestImportedAt = importTime;
    savedSheet.lastSyncedAt = importTime;

    await savedSheet.save();

    return res.status(200).json({
      success: true,
      message: "Google Sheet import completed successfully.",
      batchId,
      imported,
      duplicates,
      skipped,
      totalRows: rows.length - 1
    });

  } catch (error) {
    console.error("Import Google Sheet Leads Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message ||
        "Unable to import Google Sheet leads."
    });
  }
};

module.exports = {
  addGoogleSheet,
  getGoogleSheets,
  previewGoogleSheet,
  importGoogleSheetLeads
};
