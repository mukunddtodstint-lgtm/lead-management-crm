
const express = require("express");
const router = express.Router();

const {
  getMonthlyPerformance,
  setMonthlyTarget,
} = require("../controllers/salesTargetController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Only Sales Manager can view monthly performance and targets
router.get(
  "/monthly-performance",
  protect,
  authorize("company_ceo", "sales_manager"),
  getMonthlyPerformance
);

// Only Sales Manager can create or update monthly targets
router.put(
  "/monthly-target/:employeeId",
  protect,
  authorize("sales_manager"),
  setMonthlyTarget
);

module.exports = router;
