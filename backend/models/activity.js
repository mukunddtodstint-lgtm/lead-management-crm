
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    activityType: {
      type: String,
      enum: [
        "call",
        "follow_up",
        "status_change",
        "note",
        "other",
      ],
      required: true,
    },

    previousStatus: {
      type: String,
      default: null,
    },

    newStatus: {
      type: String,
      default: null,
    },

    followUpStage: {
      type: Number,
      min: 1,
      max: 6,
      default: null,
    },

    remarks: {
      type: String,
      required: true,
      trim: true,
    },

    nextFollowUpDate: {
      type: Date,
      default: null,
    },

    activityDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({
  companyId: 1,
  performedBy: 1,
  activityDate: -1,
});

activitySchema.index({
  leadId: 1,
  activityDate: -1,
});

module.exports = mongoose.model("Activity", activitySchema);
