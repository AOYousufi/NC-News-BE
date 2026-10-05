const { selectCommentsByArticle_ID } = require("../Models/selectCommentsByID.model");

async function selectCommentsByArticleId(req, res, next) {
  try {
    const comments = await selectCommentsByArticle_ID(req.params.article_id);
    res.status(200).send({ comments });
  } catch (error) {
    next(error);
  }
}

module.exports = selectCommentsByArticleId;
