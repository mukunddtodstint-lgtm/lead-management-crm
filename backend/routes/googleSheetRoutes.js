
const express = require("express");
const router = express.Router();

const {
  addGoogleSheet,
  getGoogleSheets,
  previewGoogleSheet,
  importGoogleSheetLeads,
} = require("../controllers/googleSheetController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Only Sales Manager can add Google Sheets
router.post(
  "/",
  protect,
  authorize("sales_manager"),
  addGoogleSheet
);

// Only Sales Manager can view saved Google Sheets
router.get(
  "/",
  protect,
  authorize("sales_manager"),
  getGoogleSheets
);

// Only Sales Manager can preview Google Sheets
router.get(
  "/:id/preview",
  protect,
  authorize("sales_manager"),
  previewGoogleSheet
);

// Only Sales Manager can import leads
router.post(
  "/:id/import",
  protect,
  authorize("sales_manager"),
  importGoogleSheetLeads
);

module.exports = router;
