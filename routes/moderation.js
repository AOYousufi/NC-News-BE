const express = require("express");
const authenticateUser = require("../middleware/auth");
const requireModerator = require("../middleware/requireModerator");
const {
  listReportsController,
  reviewReportController,
} = require("../Controllers/report.controller");
const {
  analyticsController,
  auditLogController,
} = require("../Controllers/moderation.controller");

const router = express.Router();

router.use(authenticateUser, requireModerator);
router.get("/reports", listReportsController);
router.get("/analytics", analyticsController);
router.get("/audit", auditLogController);
router.patch("/reports/:report_id", reviewReportController);

module.exports = router;
