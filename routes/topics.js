const express = require("express");
const authenticateUser = require("../middleware/auth");
const fetchAllTopics = require("../Controllers/fetchAllTopics.controller.js");
const createTopic = require("../Controllers/createTopic.controller");

const router = express.Router();

router.get("/", fetchAllTopics);
router.post("/", authenticateUser, createTopic);

module.exports = router;
