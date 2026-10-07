const { getPublicProfileStats } = require("../Models/profile.model");

async function getUserStats(req, res, next) {
  try {
    const stats = await getPublicProfileStats(req.params.username);
    res.status(200).send({ stats });
  } catch (error) {
    next(error);
  }
}

module.exports = { getUserStats };
