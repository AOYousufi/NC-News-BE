const express = require("express");
const authenticateUser = require("../middleware/auth");
const fetchArticleById = require("../Controllers/fetchArticlesById.controller");
const getAllArticles = require("../Controllers/getAllArticles.controller");
const selectCommentsByArticleId = require("../Controllers/selectCommentsByArticleID.controller");
const addNewComment = require("../Controllers/addNewComment.controller");
const updateArticle = require("../Controllers/updateArticle.controller");

const router = express.Router();

router.get("/", getAllArticles);
router.get("/:article_id", fetchArticleById);
router.get("/:article_id/comments", selectCommentsByArticleId);
router.post("/:article_id/comments", authenticateUser, addNewComment);
router.patch("/:article_id", authenticateUser, updateArticle);

module.exports = router;
