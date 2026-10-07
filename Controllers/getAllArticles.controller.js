const { fetchAllArticles } = require("../Models/getAllArticles.model");

async function getAllArticles(req, res, next) {
  try {
    const { sort_by, order, topic, author, search, limit, p } = req.query;
    const result = await fetchAllArticles({
      sort_by,
      order,
      topic,
      author,
      search,
      limit,
      p,
    });
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}

module.exports = getAllArticles;
