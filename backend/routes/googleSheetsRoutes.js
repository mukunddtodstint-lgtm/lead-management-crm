
const express = require("express");
const router = express.Router();

const {
  startGoogleAuth,
  googleOAuthCallback,
} = require("../controllers/googleSheetsController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Only Sales Manager can connect Google account
router.get(
  "/oauth/start",
  protect,
  authorize("sales_manager"),
  startGoogleAuth
);

// Google OAuth callback
router.get(
  "/oauth/callback",
  googleOAuthCallback
);

module.exports = router;
