const deleteCommentById = require("../Models/deleteComment.model");

async function deleteComment(req, res, next) {
  try {
    await deleteCommentById(req.params.comment_id, req.user.username);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = deleteComment;
