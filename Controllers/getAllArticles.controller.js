const { fetchAllArticles } = require("../Models/getAllArticles.model");

async function getAllArticles(req, res, next) {
  try {
    const { sort_by, order, topic, author, limit, p } = req.query;
    const articles = await fetchAllArticles({
      sort_by,
      order,
      topic,
      author,
      limit,
      p,
    });
    res.status(200).send({ articles });
  } catch (error) {
    next(error);
  }
}

module.exports = getAllArticles;
