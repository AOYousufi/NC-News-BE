const editComment = require("../Models/editComment.model");

async function editCommentController(req, res, next) {
  try {
    if (
      !req.body ||
      Object.keys(req.body).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(req.body, "body")
    ) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const comment = await editComment(
      req.params.comment_id,
      req.user.username,
      req.body.body
    );

    res.status(200).send({ comment });
  } catch (error) {
    next(error);
  }
}

module.exports = editCommentController;
