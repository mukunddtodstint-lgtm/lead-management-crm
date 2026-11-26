
const mongoose = require("mongoose");

const syncLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Integration",
      required: true,
      index: true,
    },

    syncType: {
      type: String,
      enum: ["automatic", "manual"],
      required: true,
    },

    status: {
      type: String,
      enum: ["started", "success", "failed", "partial"],
      default: "started",
    },

    totalRowsFetched: {
      type: Number,
      default: 0,
    },

    newLeadsImported: {
      type: Number,
      default: 0,
    },

    existingLeadsSkipped: {
      type: Number,
      default: 0,
    },

    failedRows: {
      type: Number,
      default: 0,
    },

    errorMessage: {
      type: String,
      default: "",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

syncLogSchema.index({
  companyId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("SyncLog", syncLogSchema);
