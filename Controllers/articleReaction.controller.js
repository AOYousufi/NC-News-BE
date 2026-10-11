const {
  getReactionSummary,
  getUserReaction,
  updateReaction,
} = require("../Models/articleReaction.model");

async function reactionSummary(req, res, next) {
  try {
    const reactions = await getReactionSummary(req.params.article_id);
    res.status(200).send({ reactions });
  } catch (error) {
    next(error);
  }
}

async function userReaction(req, res, next) {
  try {
    const result = await getUserReaction(
      req.params.article_id,
      req.user.username
    );
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}

async function updateReactionController(req, res, next) {
  try {
    if (
      !req.body ||
      Object.keys(req.body).length !== 1 ||
      typeof req.body.reaction !== "string"
    ) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const result = await updateReaction(
      req.params.article_id,
      req.user.username,
      req.body.reaction
    );

    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  reactionSummary,
  updateReactionController,
  userReaction,
};
