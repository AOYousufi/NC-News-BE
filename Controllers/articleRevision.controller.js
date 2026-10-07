const getArticleRevisions = require("../Models/articleRevision.model");

async function getArticleRevisionsController(req, res, next) {
  try {
    const revisions = await getArticleRevisions(
      req.params.article_id,
      req.user.username
    );
    res.status(200).send({ revisions });
  } catch (error) {
    next(error);
  }
}

module.exports = getArticleRevisionsController;
