const {
  getCommentVotesForArticle,
  updateCommentVote,
} = require("../Models/commentVote.model");

async function voteOnComment(req, res, next) {
  try {
    const comment = await updateCommentVote(
      req.params.comment_id,
      req.body?.inc_votes,
      req.user.username
    );
    res.status(200).send({ comment });
  } catch (error) {
    next(error);
  }
}

async function getArticleCommentVotes(req, res, next) {
  try {
    const votes = await getCommentVotesForArticle(
      req.params.article_id,
      req.user.username
    );
    res.status(200).send({ votes });
  } catch (error) {
    next(error);
  }
}

module.exports = { getArticleCommentVotes, voteOnComment };
