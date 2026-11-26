
const mongoose = require("mongoose");

const googleSheetSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    spreadsheetId: {
      type: String,
      required: true,
      trim: true
    },

    spreadsheetUrl: {
      type: String,
      required: true,
      trim: true
    },

    sheetName: {
      type: String,
      required: true,
      trim: true,
      default: "Sheet1"
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    lastSyncedAt: {
      type: Date,
      default: null
    },

    // Latest import batch tracking
    latestImportBatchId: {
      type: String,
      default: null
    },

    latestImportedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Prevent duplicate sheet entries within the same company
googleSheetSchema.index(
  { companyId: 1, spreadsheetId: 1, sheetName: 1 },
  { unique: true }
);

module.exports = mongoose.model("GoogleSheet", googleSheetSchema);
