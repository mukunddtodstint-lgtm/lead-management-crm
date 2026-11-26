const mongoose = require("mongoose");

const googleOAuthStateSchema = new mongoose.Schema({
  nonce: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  }
}, { timestamps: true });

module.exports = mongoose.model(
  "GoogleOAuthState",
  googleOAuthStateSchema
);