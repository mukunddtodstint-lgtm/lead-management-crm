
const express = require("express");
const router = express.Router();

const {
  createCompanyCEO,
  createSalesManager,
  createSalesExecutive,
  getEmployees,
} = require("../controllers/userController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Super Admin creates Company CEO
router.post(
  "/company-ceo",
  protect,
  authorize("super_admin"),
  createCompanyCEO
);

// Company CEO creates Sales Manager
router.post(
  "/sales-manager",
  protect,
  authorize("company_ceo"),
  createSalesManager
);

// Sales Manager creates Sales Executive
router.post(
  "/sales-executive",
  protect,
  authorize("sales_manager"),
  createSalesExecutive
);

// Employee listing
router.get(
  "/",
  protect,
  authorize("super_admin", "company_ceo", "sales_manager"),
  getEmployees
);

module.exports = router;
