
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "qualified",
        "not_qualified",
        "not_connected",
        "converted"
      ],
      required: true
    },

    remarks: {
      type: String,
      required: true,
      trim: true
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    nextFollowUpDate: {
      type: Date,
      default: null
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },

    googleSheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoogleSheet",
      required: true,
      index: true
    },

    sourceRowId: {
      type: String,
      required: true
    },

    // Import batch tracking
    importBatchId: {
      type: String,
      default: null,
      index: true
    },

    importedAt: {
      type: Date,
      default: null
    },

    leadData: {
      created_time: String,
      "what_are_you_looking_for?": String,
      "what_is_your_preferred_investment_budget?": String,
      full_name: String,
      phone_number: String,
      email: String,
      city: String
    },

    normalizedPhone: {
      type: String,
      default: null
    },

    normalizedEmail: {
      type: String,
      default: null
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    assignedAt: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: [
        "new",
        "qualified",
        "not_qualified",
        "not_connected",
        "converted"
      ],
      default: "new"
    },

    // First successful conversion date
    convertedAt: {
      type: Date,
      default: null
    },

    remarks: {
      type: String,
      default: "",
      trim: true
    },

    nextFollowUpDate: {
      type: Date,
      default: null
    },

    activityHistory: {
      type: [activitySchema],
      default: []
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Prevent duplicate source rows
leadSchema.index(
  { companyId: 1, googleSheetId: 1, sourceRowId: 1 },
  { unique: true }
);

leadSchema.index({ companyId: 1, normalizedPhone: 1 });
leadSchema.index({ companyId: 1, normalizedEmail: 1 });

// Sales Executive: latest assigned leads first
leadSchema.index({
  companyId: 1,
  assignedTo: 1,
  assignedAt: -1
});

// Monthly conversion reporting
leadSchema.index({
  companyId: 1,
  assignedTo: 1,
  convertedAt: 1
});

module.exports = mongoose.model("Lead", leadSchema);
