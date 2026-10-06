const deleteArticle = require("../Models/deleteArticle.model");

async function deleteArticleController(req, res, next) {
  try {
    await deleteArticle(req.params.article_id, req.user.username);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = deleteArticleController;
