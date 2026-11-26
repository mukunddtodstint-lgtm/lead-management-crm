
const express = require("express");

const router = express.Router();

const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  updateCompanyStatus,
  getLeadFieldSettings,
  updateLeadFieldSettings,
} = require("../controllers/companyController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ======================================
// GET LEAD FIELD SETTINGS
// ======================================

router.get(
  "/lead-field-settings",
  protect,
  authorize("company_ceo", "sales_manager", "sales"),
  getLeadFieldSettings
);

// Only Company CEO can update settings
router.put(
  "/lead-field-settings",
  protect,
  authorize("company_ceo"),
  updateLeadFieldSettings
);

// ======================================
// SUPER ADMIN - COMPANY MANAGEMENT
// ======================================

router.use(protect, authorize("super_admin"));

router.post("/", createCompany);
router.get("/", getAllCompanies);
router.get("/:id", getCompanyById);
router.put("/:id", updateCompany);
router.patch("/:id/status", updateCompanyStatus);

module.exports = router;
