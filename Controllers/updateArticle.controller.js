const {
  update_Article,
  getUserArticleVote,
} = require("../Models/updateArticle.model");
const editArticle = require("../Models/editArticle.model");
const { validateArticleFields } = require("../utils/articleValidation");
const { badRequest } = require("../utils/validation");

async function updateArticle(req, res, next) {
  try {
    const body = req.body || {};
    const keys = Object.keys(body);
    const isVote = Object.prototype.hasOwnProperty.call(body, "inc_votes");

    if (isVote) {
      if (keys.length !== 1) throw badRequest();

      const article = await update_Article(
        req.params.article_id,
        body.inc_votes,
        req.user.username
      );
      return res.status(200).send({ article });
    }

    const updates = validateArticleFields(body, { partial: true });
    const article = await editArticle(
      req.params.article_id,
      req.user.username,
      updates
    );

    res.status(200).send({ article });
  } catch (error) {
    next(error);
  }
}

async function getArticleVote(req, res, next) {
  try {
    const vote = await getUserArticleVote(
      req.params.article_id,
      req.user.username
    );
    res.status(200).send(vote);
  } catch (error) {
    next(error);
  }
}

module.exports = { updateArticle, getArticleVote };
