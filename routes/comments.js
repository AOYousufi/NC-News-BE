const express = require("express");
const authenticateUser = require("../middleware/auth");
const deleteComment = require("../Controllers/deleteComment.controller");
const editComment = require("../Controllers/editComment.controller");
const { voteOnComment } = require("../Controllers/commentVote.controller");

const router = express.Router();

router.patch("/:comment_id/vote", authenticateUser, voteOnComment);
router.patch("/:comment_id", authenticateUser, editComment);
router.delete("/:comment_id", authenticateUser, deleteComment);

module.exports = router;
