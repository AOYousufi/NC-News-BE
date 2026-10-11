const express = require("express");
const authenticateUser = require("../middleware/auth");
const fetchAllTopics = require("../Controllers/fetchAllTopics.controller.js");
const createTopic = require("../Controllers/createTopic.controller");
const {
  followTopicController,
  topicFollowStatus,
  trendingTopics,
  unfollowTopicController,
} = require("../Controllers/discovery.controller");

const router = express.Router();

router.get("/", fetchAllTopics);
router.get("/trending", trendingTopics);
router.post("/", authenticateUser, createTopic);
router.get("/:slug/follow-status", authenticateUser, topicFollowStatus);
router.post("/:slug/follow", authenticateUser, followTopicController);
router.delete("/:slug/follow", authenticateUser, unfollowTopicController);

module.exports = router;
