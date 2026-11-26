
const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
} = require("../controllers/dashboardController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Company CEO and Sales Manager dashboard access
router.get(
  "/stats",
  protect,
  authorize("company_ceo", "sales_manager"),
  getDashboardStats
);

module.exports = router;
