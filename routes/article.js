const express = require("express");
const authenticateUser = require("../middleware/auth");
const fetchArticleById = require("../Controllers/fetchArticlesById.controller");
const getAllArticles = require("../Controllers/getAllArticles.controller");
const selectCommentsByArticleId = require("../Controllers/selectCommentsByArticleID.controller");
const addNewComment = require("../Controllers/addNewComment.controller");
const {
  updateArticle,
  getArticleVote,
} = require("../Controllers/updateArticle.controller");
const createArticle = require("../Controllers/createArticle.controller");
const deleteArticle = require("../Controllers/deleteArticle.controller");
const {
  getDraftsController,
  getFollowingFeedController,
  getManagedArticleController,
  saveArticleController,
  unsaveArticleController,
} = require("../Controllers/social.controller");

const router = express.Router();

router.get("/", getAllArticles);
router.post("/", authenticateUser, createArticle);

router.get("/feed", authenticateUser, getFollowingFeedController);
router.get("/drafts", authenticateUser, getDraftsController);

router.get("/:article_id/manage", authenticateUser, getManagedArticleController);
router.get("/:article_id/vote", authenticateUser, getArticleVote);
router.post("/:article_id/save", authenticateUser, saveArticleController);
router.delete("/:article_id/save", authenticateUser, unsaveArticleController);

router.get("/:article_id", fetchArticleById);
router.get("/:article_id/comments", selectCommentsByArticleId);
router.post("/:article_id/comments", authenticateUser, addNewComment);
router.patch("/:article_id", authenticateUser, updateArticle);
router.delete("/:article_id", authenticateUser, deleteArticle);

module.exports = router;
