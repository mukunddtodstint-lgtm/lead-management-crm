
const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    integrationName: {
      type: String,
      required: true,
      trim: true,
    },

    provider: {
      type: String,
      enum: ["google_sheets"],
      default: "google_sheets",
    },

    spreadsheetId: {
      type: String,
      required: true,
      trim: true,
    },

    spreadsheetName: {
      type: String,
      default: "",
    },

    sheetName: {
      type: String,
      required: true,
      default: "Sheet1",
    },

    columnMapping: {
      type: Map,
      of: String,
      default: {},
    },

    visibleColumns: {
      type: [String],
      default: [],
    },

    syncMode: {
      type: String,
      enum: ["read_only"],
      default: "read_only",
    },

    syncEnabled: {
      type: Boolean,
      default: true,
    },

    lastSyncedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "error"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate connections for the same sheet tab
integrationSchema.index(
  {
    companyId: 1,
    spreadsheetId: 1,
    sheetName: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Integration", integrationSchema);
