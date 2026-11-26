
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: function () {
        return this.role === "super_admin";
      },
    },

    employeeId: {
      type: String,
      trim: true,
      uppercase: true,
      required: function () {
        return this.role !== "super_admin";
      },
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      required: function () {
        return this.role !== "super_admin";
      },
    },

    role: {
      type: String,
      enum: [
        "super_admin",
        "company_ceo",
        "sales_manager",
        "sales",
        "company_admin" // Temporary compatibility for existing accounts
      ],
      required: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Employee ID must be unique within each company
userSchema.index(
  { companyId: 1, employeeId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      companyId: { $type: "objectId" },
      employeeId: { $type: "string" },
    },
  }
);

// Super Admin email must be unique
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "super_admin",
    },
  }
);

module.exports = mongoose.model("User", userSchema);
