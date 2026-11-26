
const mongoose = require("mongoose");

const googleSheetConnectionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true
    },

    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    googleEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },

    refreshTokenEncrypted: {
      type: String,
      required: true,
      select: false
    },

    status: {
      type: String,
      enum: ["connected", "disconnected"],
      default: "connected"
    },

    connectedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "GoogleSheetConnection",
  googleSheetConnectionSchema
);
