const { addComment } = require("../Models/addComment.model");

async function addNewComment(req, res, next) {
  try {
    const { article_id } = req.params;
    const { body } = req.body;

    if (typeof body !== "string" || body.trim().length === 0) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const comment = await addComment(req.user.username, body.trim(), article_id);
    res.status(201).send({ Comment: comment });
  } catch (error) {
    next(error);
  }
}

module.exports = addNewComment;
