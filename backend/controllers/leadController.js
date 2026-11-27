const Lead = require("../models/Lead");
const User = require("../models/user");
const Company = require("../models/company");
const GoogleSheet = require("../models/GoogleSheet");
const mongoose = require("mongoose");

// ==========================================
// DEFAULT LEAD FIELD SETTINGS
// ==========================================

const defaultLeadFieldSettings = {
  created_time: true,
  "what_are_you_looking_for?": true,
  "what_is_your_preferred_investment_budget?": true,
  full_name: true,
  phone_number: true,
  email: true,
  city: true,
};

// ==========================================
// HELPER: ESCAPE SEARCH REGEX
// ==========================================

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ==========================================
// HELPER: GET LATEST IMPORT BATCH
// ==========================================

const getLatestBatchFilter = async (companyId) => {
  const sheets = await GoogleSheet.find({
    companyId,
    status: "active",
    latestImportBatchId: { $ne: null },
  })
    .select("_id latestImportBatchId")
    .lean();

  if (!sheets.length) {
    return { _id: null };
  }

  return {
    $or: sheets.map((sheet) => ({
      googleSheetId: sheet._id,
      importBatchId: sheet.latestImportBatchId,
    })),
  };
};

// ==========================================
// HELPER: GET COMPANY FIELD SETTINGS
// ==========================================

const getCompanyFieldSettings = async (companyId) => {
  const company = await Company.findById(companyId)
    .select("leadFieldSettings")
    .lean();

  return {
    ...defaultLeadFieldSettings,
    ...(company?.leadFieldSettings || {}),
  };
};

// ==========================================
// HELPER: HIDE DISABLED LEAD FIELDS
// ==========================================

const filterLeadFields = (lead, settings) => {
  if (!lead) return lead;

  const filteredLead =
    typeof lead.toObject === "function"
      ? lead.toObject()
      : { ...lead };

  const leadData = { ...(filteredLead.leadData || {}) };

  Object.keys(defaultLeadFieldSettings).forEach((field) => {
    if (settings[field] === false) {
      delete leadData[field];
    }
  });

  filteredLead.leadData = leadData;

  return filteredLead;
};

// ==========================================
// 1. SALES MANAGER: GET COMPANY LEADS
// ==========================================

const getCompanyLeads = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

    const latestBatchFilter = await getLatestBatchFilter(
      req.user.companyId
    );

    const conditions = [
      { companyId: req.user.companyId },
      latestBatchFilter,
    ];

    if (status) {
      conditions.push({ status });
    }

    if (String(search).trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      conditions.push({
        $or: [
          { "leadData.full_name": searchRegex },
          { "leadData.phone_number": searchRegex },
          { "leadData.email": searchRegex },
          { "leadData.city": searchRegex },
        ],
      });
    }

    const filter = { $and: conditions };

    const totalLeads = await Lead.countDocuments(filter);

    const leads = await Lead.find(filter)
      .select("-__v")
      .populate("assignedTo", "name employeeId")
      .sort({ importedAt: -1, createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return res.status(200).json({
      success: true,
      totalLeads,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalLeads / pageSize),
      leads,
    });
  } catch (error) {
    console.error("Get Company Leads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch leads.",
    });
  }
};

// ==========================================
// 2. SALES MANAGER: ASSIGN LEADS
// ==========================================

const assignLeads = async (req, res) => {
  try {
    const { leadIds, employeeId } = req.body;

    if (
      !Array.isArray(leadIds) ||
      leadIds.length === 0 ||
      !employeeId ||
      typeof employeeId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select leads and a Sales Executive.",
      });
    }

    if (
      !leadIds.every((id) =>
        mongoose.Types.ObjectId.isValid(id)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID provided.",
      });
    }

    const executive = await User.findOne({
      employeeId: employeeId.trim().toUpperCase(),
      companyId: req.user.companyId,
      role: "sales",
      status: "active",
    });

    if (!executive) {
      return res.status(404).json({
        success: false,
        message: "Active Sales Executive not found in your company.",
      });
    }

    const latestBatchFilter = await getLatestBatchFilter(
      req.user.companyId
    );

    const result = await Lead.updateMany(
      {
        $and: [
          {
            _id: { $in: leadIds },
            companyId: req.user.companyId,
            assignedTo: null,
          },
          latestBatchFilter,
        ],
      },
      {
        $set: {
          assignedTo: executive._id,
          assignedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} latest batch leads assigned successfully.`,
      assignedCount: result.modifiedCount,
      skippedCount: leadIds.length - result.modifiedCount,
    });
  } catch (error) {
    console.error("Assign Leads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to assign leads.",
    });
  }
};

// ==========================================
// 3. SALES EXECUTIVE: GET MY LEADS
// ==========================================

const getMyLeads = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

    const settings = await getCompanyFieldSettings(
      req.user.companyId
    );

    const filter = {
      companyId: req.user.companyId,
      assignedTo: req.user.userId,
    };

    if (status) {
      filter.status = status;
    }

    if (String(search).trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      const searchableFields = [
        "full_name",
        "phone_number",
        "email",
        "city",
      ].filter((field) => settings[field] !== false);

      if (searchableFields.length) {
        filter.$or = searchableFields.map((field) => ({
          [`leadData.${field}`]: searchRegex,
        }));
      } else {
        filter._id = null;
      }
    }

    const totalLeads = await Lead.countDocuments(filter);

    const leads = await Lead.find(filter)
      .select("-__v")
      .sort({ assignedAt: -1, createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const filteredLeads = leads.map((lead) =>
      filterLeadFields(lead, settings)
    );

    return res.status(200).json({
      success: true,
      totalLeads,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalLeads / pageSize),
      leads: filteredLeads,
    });
  } catch (error) {
    console.error("Get My Leads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your assigned leads.",
    });
  }
};

// ==========================================
// 4. SALES EXECUTIVE: UPDATE ASSIGNED LEAD
// ==========================================

const updateMyLead = async (req, res) => {
  try {
    console.log("========== LEAD UPDATE DEBUG ==========");
    console.log("Lead ID:", req.params.id);
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Received Status:", req.body?.status);
    console.log("=======================================");

    const { id } = req.params;

    // Validate lead ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    // Normalize status
    const rawStatus = String(req.body?.status || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    const allowedStatuses = [
      "qualified",
      "not_qualified",
      "not_connected",
      "converted",
    ];

    if (!allowedStatuses.includes(rawStatus)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid lead status.",
        receivedStatus: req.body?.status,
        normalizedStatus: rawStatus,
        allowedStatuses,
      });
    }

    const status = rawStatus;

    // Validate remarks
    const remarks = String(
      req.body?.remarks ??
      req.body?.remark ??
      req.body?.notes ??
      ""
    ).trim();

    if (!remarks) {
      return res.status(400).json({
        success: false,
        message: "Remarks are mandatory for every lead update.",
      });
    }

    // Get follow-up date
    const rawFollowUpDate =
      req.body?.nextFollowUpDate ??
      req.body?.nextFollowupDate ??
      req.body?.followUpDate ??
      null;

    let followUpDate = null;

    if (status !== "converted" && rawFollowUpDate) {
      followUpDate = new Date(rawFollowUpDate);

      if (Number.isNaN(followUpDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid next follow-up date.",
          receivedDate: rawFollowUpDate,
        });
      }
    }

    // Find lead belonging to logged-in executive
    const lead = await Lead.findOne({
      _id: id,
      companyId: req.user.companyId,
      assignedTo: req.user.userId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or not assigned to you.",
      });
    }

    const now = new Date();

    // Update lead fields
    lead.status = status;
    lead.remarks = remarks;
    lead.nextFollowUpDate = followUpDate;

    // Manage conversion date
    if (status === "converted") {
      if (!lead.convertedAt) {
        lead.convertedAt = now;
      }
    } else {
      lead.convertedAt = null;
    }

    // Initialize activity history if missing
    if (!Array.isArray(lead.activityHistory)) {
      lead.activityHistory = [];
    }

    // Save activity history
    lead.activityHistory.push({
      status,
      remarks,
      updatedBy: req.user.userId,
      nextFollowUpDate: followUpDate,
      updatedAt: now,
    });

    // Save updated lead
    await lead.save();

    // Apply company field settings
    const settings = await getCompanyFieldSettings(
      req.user.companyId
    );

    const updatedLead = filterLeadFields(lead, settings);

    console.log("Lead updated successfully:", lead._id);

    return res.status(200).json({
      success: true,
      message:
        status === "converted"
          ? "Lead marked as converted successfully."
          : status === "qualified"
          ? "Lead marked as qualified successfully."
          : status === "not_qualified"
          ? "Lead marked as not qualified successfully."
          : "Lead marked as not connected successfully.",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Update My Lead Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Lead validation failed.",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update lead.",
      error: error.message,
    });
  }
};

// ==========================================
// 5. SALES MANAGER: GET LEAD ACTIVITY HISTORY
// ==========================================

const getLeadHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const lead = await Lead.findOne({
      _id: id,
      companyId: req.user.companyId,
    })
      .populate("assignedTo", "name employeeId")
      .populate("activityHistory.updatedBy", "name employeeId")
      .lean();

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    return res.status(200).json({
      success: true,
      lead: {
        _id: lead._id,
        leadData: lead.leadData,
        assignedTo: lead.assignedTo,
        status: lead.status,
        remarks: lead.remarks,
        nextFollowUpDate: lead.nextFollowUpDate,
        convertedAt: lead.convertedAt,
        activityHistory: lead.activityHistory || [],
      },
    });
  } catch (error) {
    console.error("Get Lead History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch lead activity history.",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  getCompanyLeads,
  assignLeads,
  getMyLeads,
  updateMyLead,
  getLeadHistory,
};
