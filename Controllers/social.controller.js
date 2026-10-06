const {
  followUser,
  getActivity,
  getDrafts,
  getFollowStatus,
  getFollowing,
  getFollowingFeed,
  getManagedArticle,
  getSavedArticles,
  saveArticle,
  unfollowUser,
  unsaveArticle,
} = require("../Models/social.model");

async function saveArticleController(req, res, next) {
  try {
    await saveArticle(req.user.username, req.params.article_id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function unsaveArticleController(req, res, next) {
  try {
    await unsaveArticle(req.user.username, req.params.article_id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function getSavedArticlesController(req, res, next) {
  try {
    const articles = await getSavedArticles(req.user.username);
    res.status(200).send({ articles });
  } catch (error) {
    next(error);
  }
}

async function followUserController(req, res, next) {
  try {
    await followUser(req.user.username, req.params.username);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function unfollowUserController(req, res, next) {
  try {
    await unfollowUser(req.user.username, req.params.username);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function getFollowingController(req, res, next) {
  try {
    const users = await getFollowing(req.user.username);
    res.status(200).send({ users });
  } catch (error) {
    next(error);
  }
}

async function getFollowStatusController(req, res, next) {
  try {
    const result = await getFollowStatus(
      req.user.username,
      req.params.username
    );
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}

async function getFollowingFeedController(req, res, next) {
  try {
    const articles = await getFollowingFeed(req.user.username, req.query);
    res.status(200).send({ articles });
  } catch (error) {
    next(error);
  }
}

async function getActivityController(req, res, next) {
  try {
    const result = await getActivity(req.user.username);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}

async function getDraftsController(req, res, next) {
  try {
    const articles = await getDrafts(req.user.username);
    res.status(200).send({ articles });
  } catch (error) {
    next(error);
  }
}

async function getManagedArticleController(req, res, next) {
  try {
    const article = await getManagedArticle(
      req.user.username,
      req.params.article_id
    );
    res.status(200).send({ article });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  followUserController,
  getActivityController,
  getDraftsController,
  getFollowStatusController,
  getFollowingController,
  getFollowingFeedController,
  getManagedArticleController,
  getSavedArticlesController,
  saveArticleController,
  unfollowUserController,
  unsaveArticleController,
};
