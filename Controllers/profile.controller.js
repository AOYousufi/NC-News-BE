const {
  getPublicProfileStats,
  getPublicUserComments,
} = require("../Models/profile.model");

async function getUserStats(req, res, next) {
  try {
    const stats = await getPublicProfileStats(req.params.username);
    res.status(200).send({ stats });
  } catch (error) {
    next(error);
  }
}

async function getUserComments(req, res, next) {
  try {
    const comments = await getPublicUserComments(req.params.username);
    res.status(200).send({ comments });
  } catch (error) {
    next(error);
  }
}

module.exports = { getUserComments, getUserStats };
