
const Lead = require("../models/lead");
const User = require("../models/user");
const Company = require("../models/Company");
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
// ESCAPE SPECIAL CHARACTERS IN SEARCH
// ==========================================

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ==========================================
// GET LATEST IMPORT BATCH FILTER
// ==========================================

const getLatestBatchFilter = async (companyId) => {
  const sheets = await GoogleSheet.find({
    companyId,
    status: "active",
    latestImportBatchId: { $ne: null },
  })
    .select("_id latestImportBatchId")
    .lean();

  if (sheets.length === 0) {
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
// FILTER HIDDEN LEAD FIELDS
// ==========================================

const filterLeadFields = (lead, settings) => {
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
// 1. SALES MANAGER: GET LATEST BATCH LEADS
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

    if (search.trim()) {
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
// 2. SALES MANAGER: ASSIGN LATEST BATCH LEADS
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

    const validLeadIds = leadIds.every((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (!validLeadIds) {
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
// 3. SALES EXECUTIVE: GET MY ASSIGNED LEADS
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

    const company = await Company.findById(req.user.companyId)
      .select("leadFieldSettings")
      .lean();

    if (!company) {
      return res.status(403).json({
        success: false,
        message: "Company not found.",
      });
    }

    const settings = {
      ...defaultLeadFieldSettings,
      ...(company.leadFieldSettings || {}),
    };

    // All assigned leads remain visible to this executive
    const filter = {
      companyId: req.user.companyId,
      assignedTo: req.user.userId,
    };

    if (status) {
      filter.status = status;
    }

    if (search.trim()) {
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

      if (searchableFields.length > 0) {
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
    const { id } = req.params;
    const { status, remarks, nextFollowUpDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const allowedStatuses = [
      "qualified",
      "not_qualified",
      "not_connected",
      "converted",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid lead status.",
      });
    }

    if (
      typeof remarks !== "string" ||
      !remarks.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Remarks are mandatory for every lead update.",
      });
    }

    let followUpDate = null;

    // Converted leads do not need another follow-up date
    if (status !== "converted" && nextFollowUpDate) {
      followUpDate = new Date(nextFollowUpDate);

      if (Number.isNaN(followUpDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid next follow-up date.",
        });
      }
    }

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

    lead.status = status;
    lead.remarks = remarks.trim();
    lead.nextFollowUpDate = followUpDate;

    if (status === "converted") {
      // Preserve the first conversion date
      if (!lead.convertedAt) {
        lead.convertedAt = now;
      }
    } else {
      // If conversion is reversed, remove active conversion date
      lead.convertedAt = null;
    }

    lead.activityHistory.push({
      status,
      remarks: remarks.trim(),
      updatedBy: req.user.userId,
      nextFollowUpDate: followUpDate,
      updatedAt: now,
    });

    await lead.save();

    const company = await Company.findById(req.user.companyId)
      .select("leadFieldSettings")
      .lean();

    const settings = {
      ...defaultLeadFieldSettings,
      ...(company?.leadFieldSettings || {}),
    };

    return res.status(200).json({
      success: true,
      message:
        status === "converted"
          ? "Lead marked as converted successfully."
          : "Lead updated successfully.",
      lead: filterLeadFields(lead, settings),
    });

  } catch (error) {
    console.error("Update My Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update lead.",
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
      .populate(
        "activityHistory.updatedBy",
        "name employeeId"
      )
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
        activityHistory: lead.activityHistory,
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
