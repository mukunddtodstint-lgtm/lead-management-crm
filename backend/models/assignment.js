
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
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

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    
assignmentType: {
  type: String,
  enum: ["manual", "reassigned"],
  default: "manual",
},

    isCurrent: {
      type: Boolean,
      default: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    unassignedAt: {
      type: Date,
      default: null,
    },

    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// A lead can have only one current assignment
assignmentSchema.index(
  { leadId: 1 },
  {
    unique: true,
    partialFilterExpression: { isCurrent: true },
  }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
