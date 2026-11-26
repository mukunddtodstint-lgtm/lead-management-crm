
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true
    },

    companyId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      trim: true
    },

    address: {
      type: String,
      trim: true
    },

    // Company-wise Sales Executive Lead Field Settings
    leadFieldSettings: {
      created_time: {
        type: Boolean,
        default: true
      },

      "what_are_you_looking_for?": {
        type: Boolean,
        default: true
      },

      "what_is_your_preferred_investment_budget?": {
        type: Boolean,
        default: true
      },

      full_name: {
        type: Boolean,
        default: true
      },

      phone_number: {
        type: Boolean,
        default: true
      },

      email: {
        type: Boolean,
        default: true
      },

      city: {
        type: Boolean,
        default: true
      }
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Company", companySchema);
