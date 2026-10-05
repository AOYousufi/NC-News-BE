const express = require("express");
const authenticateUser = require("../middleware/auth");
const deleteComment = require("../Controllers/deleteComment.controller");

const router = express.Router();

router.delete("/:comment_id", authenticateUser, deleteComment);

module.exports = router;
