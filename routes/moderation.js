const express = require("express");
const authenticateUser = require("../middleware/auth");
const requireModerator = require("../middleware/requireModerator");
const {
  listReportsController,
  reviewReportController,
} = require("../Controllers/report.controller");

const router = express.Router();

router.use(authenticateUser, requireModerator);
router.get("/reports", listReportsController);
router.patch("/reports/:report_id", reviewReportController);

module.exports = router;
