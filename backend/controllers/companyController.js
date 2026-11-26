
const Company = require("../models/Company");

// Default Lead Field Settings
const defaultLeadFieldSettings = {
  created_time: true,
  "what_are_you_looking_for?": true,
  "what_is_your_preferred_investment_budget?": true,
  full_name: true,
  phone_number: true,
  email: true,
  city: true,
};

// Create Company
const createCompany = async (req, res) => {
  try {
    const { companyName, companyId, email, phone, address } = req.body;

    if (!companyName || !companyId) {
      return res.status(400).json({
        success: false,
        message: "Company name and Company ID are required.",
      });
    }

    const existingCompany = await Company.findOne({
      companyId: companyId.trim().toUpperCase(),
    });

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: "Company ID already exists.",
      });
    }

    const company = await Company.create({
      companyName,
      companyId: companyId.trim().toUpperCase(),
      email,
      phone,
      address,
    });

    return res.status(201).json({
      success: true,
      message: "Company created successfully.",
      company,
    });
  } catch (error) {
    console.error("Create Company Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create company.",
    });
  }
};

// Get All Companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    console.error("Get Companies Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch companies.",
    });
  }
};

// Get Single Company
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    return res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("Get Company Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch company.",
    });
  }
};

// Update Company
const updateCompany = async (req, res) => {
  try {
    const { companyId, ...updates } = req.body;

    const allowedFields = [
      "companyName",
      "email",
      "phone",
      "address",
    ];

    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: safeUpdates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Company updated successfully.",
      company,
    });
  } catch (error) {
    console.error("Update Company Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update company.",
    });
  }
};

// Activate / Deactivate Company
const updateCompanyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive.",
      });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Company ${status} successfully.`,
      company,
    });
  } catch (error) {
    console.error("Update Company Status Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update company status.",
    });
  }
};

// GET Company Lead Field Settings
const getLeadFieldSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "Company association not found.",
      });
    }

    const company = await Company.findById(companyId).select(
      "leadFieldSettings"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    const savedSettings =
      company.leadFieldSettings?.toObject?.() ||
      company.leadFieldSettings ||
      {};

    const settings = {
      ...defaultLeadFieldSettings,
      ...savedSettings,
    };

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get Lead Field Settings Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch lead field settings.",
    });
  }
};

// UPDATE Company Lead Field Settings
const updateLeadFieldSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "Company association not found.",
      });
    }

    const allowedFields = Object.keys(defaultLeadFieldSettings);
    const incomingSettings = req.body.settings;

    if (
      !incomingSettings ||
      typeof incomingSettings !== "object" ||
      Array.isArray(incomingSettings)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid settings object is required.",
      });
    }

    const invalidFields = Object.keys(incomingSettings).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more invalid lead fields were provided.",
        invalidFields,
      });
    }

    for (const [field, value] of Object.entries(incomingSettings)) {
      if (typeof value !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `Setting '${field}' must be true or false.`,
        });
      }
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    const currentSettings = {
      ...defaultLeadFieldSettings,
      ...(company.leadFieldSettings?.toObject?.() ||
        company.leadFieldSettings ||
        {}),
    };

    const updatedSettings = {
      ...currentSettings,
      ...incomingSettings,
    };

    company.set("leadFieldSettings", updatedSettings);

    await company.save();

    return res.status(200).json({
      success: true,
      message: "Lead field settings updated successfully.",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Update Lead Field Settings Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update lead field settings.",
    });
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  updateCompanyStatus,
  getLeadFieldSettings,
  updateLeadFieldSettings,
};
