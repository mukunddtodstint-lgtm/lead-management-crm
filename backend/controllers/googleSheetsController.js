
const User = require("../models/user");
const Company = require("../models/Company");
const GoogleOAuthState = require("../models/GoogleOAuthState");
const GoogleSheetConnection = require("../models/GoogleSheetConnection");

const crypto = require("crypto");
const mongoose = require("mongoose");
const { google } = require("googleapis");

const {
  getGoogleOAuthClient,
  getGoogleAuthorizationUrl,
} = require("../services/googleOAuthService");

const ALGORITHM = "aes-256-gcm";

// Sign OAuth state
const signState = (payload) => {
  const encoded = Buffer.from(
    JSON.stringify(payload)
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(encoded)
    .digest("hex");

  return `${encoded}.${signature}`;
};

// Verify OAuth state
const verifyState = (state) => {
  const [encoded, signature] = (state || "").split(".");

  if (!encoded || !signature) {
    throw new Error("Invalid OAuth state.");
  }

  const expected = crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(encoded)
    .digest("hex");

  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid OAuth signature.");
  }

  const payload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8")
  );

  if (!payload.expiresAt || payload.expiresAt < Date.now()) {
    throw new Error("OAuth state expired.");
  }

  if (
    !mongoose.isValidObjectId(payload.userId) ||
    !mongoose.isValidObjectId(payload.companyId)
  ) {
    throw new Error("Invalid company or user.");
  }

  if (!payload.nonce) {
    throw new Error("OAuth nonce missing.");
  }

  return payload;
};

// Encrypt Google refresh token
const encryptToken = (token) => {
  const key = Buffer.from(
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
    "hex"
  );

  if (key.length !== 32) {
    throw new Error("Invalid encryption key.");
  }

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  return [
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

// Start Google OAuth
// Only Sales Manager can connect Google Sheets
const startGoogleAuth = async (req, res) => {
  try {
    if (req.user.role !== "sales_manager") {
      return res.status(403).json({
        success: false,
        message: "Only Sales Manager can connect Google Sheets.",
      });
    }

    if (!req.user.companyId) {
      return res.status(400).json({
        success: false,
        message: "Company information is missing.",
      });
    }

    // Verify active Sales Manager
    const user = await User.findById(req.user.userId);

    if (
      !user ||
      user.status !== "active" ||
      user.role !== "sales_manager" ||
      String(user.companyId) !== String(req.user.companyId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Active Sales Manager required.",
      });
    }

    // Verify active company
    const company = await Company.findById(req.user.companyId);

    if (!company || company.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Company is inactive or does not exist.",
      });
    }

    const nonce = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await GoogleOAuthState.create({
      nonce,
      userId: req.user.userId,
      companyId: req.user.companyId,
      expiresAt,
    });

    const state = signState({
      userId: req.user.userId,
      companyId: req.user.companyId,
      nonce,
      expiresAt: expiresAt.getTime(),
    });

    return res.json({
      success: true,
      authorizationUrl: getGoogleAuthorizationUrl(state),
    });

  } catch (error) {
    console.error("Google OAuth start error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start Google authorization.",
    });
  }
};

// Google OAuth callback
const googleOAuthCallback = async (req, res) => {
  try {
    if (req.query.error) {
      return res.status(400).send(
        "Google authorization was cancelled."
      );
    }

    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send(
        "Authorization details missing."
      );
    }

    // Verify signed state
    const payload = verifyState(state);

    // Verify and consume one-time nonce
    const savedState = await GoogleOAuthState.findOneAndDelete({
      nonce: payload.nonce,
      userId: payload.userId,
      companyId: payload.companyId,
      expiresAt: { $gt: new Date() },
    });

    if (!savedState) {
      return res.status(400).send(
        "Authorization expired or already used. Please reconnect."
      );
    }

    // Verify active Sales Manager
    const user = await User.findById(payload.userId);

    if (
      !user ||
      user.status !== "active" ||
      user.role !== "sales_manager"
    ) {
      return res.status(403).send(
        "Access denied. Active Sales Manager required."
      );
    }

    // Verify company ownership
    if (
      !user.companyId ||
      String(user.companyId) !== String(payload.companyId)
    ) {
      return res.status(403).send(
        "Company verification failed."
      );
    }

    // Verify active company
    const company = await Company.findById(payload.companyId);

    if (!company || company.status !== "active") {
      return res.status(403).send(
        "Company is inactive or does not exist."
      );
    }

    // Exchange authorization code for tokens
    const oauth2Client = getGoogleOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res.status(400).send(
        "Refresh token missing. Revoke CRM access from your Google Account and reconnect."
      );
    }

    oauth2Client.setCredentials(tokens);

    // Get Google account profile
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      return res.status(400).send(
        "Google email unavailable."
      );
    }

    // Save encrypted refresh token company-wise
    await GoogleSheetConnection.findOneAndUpdate(
      { companyId: payload.companyId },
      {
        companyId: payload.companyId,
        connectedBy: payload.userId,
        googleEmail: profile.email,
        refreshTokenEncrypted: encryptToken(tokens.refresh_token),
        status: "connected",
        connectedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.send(
      "Google account connected successfully. You can close this window."
    );

  } catch (error) {
    console.error("Google OAuth callback error:", error);

    return res.status(400).send(
      "Google authorization could not be completed. Please reconnect."
    );
  }
};

module.exports = {
  startGoogleAuth,
  googleOAuthCallback,
};
