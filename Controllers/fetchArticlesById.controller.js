const getArticle = require("../Models/fetchArticleById.model");

async function fetchArticleById(req, res, next) {
  try {
    const { rows } = await getArticle(req.params.article_id);
    if (rows.length === 0) return next({ status: 404, msg: "Not Found" });
    res.status(200).send({ article: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = fetchArticleById;
