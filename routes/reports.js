const express = require("express");
const authenticateUser = require("../middleware/auth");
const { createReportController } = require("../Controllers/report.controller");

const router = express.Router();

router.post("/", authenticateUser, createReportController);

module.exports = router;
