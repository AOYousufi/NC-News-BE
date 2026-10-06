const createArticle = require("../Models/createArticle.model");
const { validateArticleFields } = require("../utils/articleValidation");

async function createArticleController(req, res, next) {
  try {
    const articleInput = validateArticleFields(req.body);
    const article = await createArticle(req.user.username, articleInput);
    res.status(201).send({ article });
  } catch (error) {
    next(error);
  }
}

module.exports = createArticleController;
