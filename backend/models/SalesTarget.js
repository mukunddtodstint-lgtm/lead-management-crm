
const mongoose = require("mongoose");

const salesTargetSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    monthStart: {
      type: Date,
      required: true,
    },

    targetCount: {
      type: Number,
      required: true,
      min: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One monthly target per executive per company
salesTargetSchema.index(
  {
    companyId: 1,
    employeeId: 1,
    monthStart: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("SalesTarget", salesTargetSchema);
