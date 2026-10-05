const { update_Article } = require("../Models/updateArticle.model");

async function updateArticle(req, res, next) {
  try {
    const article = await update_Article(req.params.article_id, req.body.inc_votes);
    res.status(200).send({ article });
  } catch (error) {
    next(error);
  }
}

module.exports = updateArticle;
