
const express = require("express");
const router = express.Router();

const {
  getCompanyLeads,
  assignLeads,
  getMyLeads,
  updateMyLead,
  getLeadHistory,
} = require("../controllers/leadController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Sales Executive: View only assigned leads
router.get(
  "/my-leads",
  protect,
  authorize("sales"),
  getMyLeads
);

// Sales Executive: Update assigned lead
router.patch(
  "/:id/update",
  protect,
  authorize("sales"),
  updateMyLead
);

// Head of Sales: View lead activity history
router.get(
  "/:id/history",
  protect,
  authorize("sales_manager"),
  getLeadHistory
);

// Head of Sales: View all company leads
router.get(
  "/",
  protect,
  authorize("sales_manager"),
  getCompanyLeads
);

// Head of Sales: Assign leads to Sales Executives
router.post(
  "/assign",
  protect,
  authorize("sales_manager"),
  assignLeads
);

module.exports = router;
