const {
  followTopic,
  getArticleRecommendations,
  getFollowedTopics,
  getTopicFollowStatus,
  getTrendingArticles,
  getTrendingTopics,
  unfollowTopic,
} = require("../Models/discovery.model");

async function trendingArticles(req, res, next) {
  try {
    const articles = await getTrendingArticles(req.query);
    res.status(200).send({ articles });
  } catch (error) {
    next(error);
  }
}

async function articleRecommendations(req, res, next) {
  try {
    const articles = await getArticleRecommendations(
      req.params.article_id,
      req.query
    );
    res.status(200).send({ articles });
  } catch (error) {
    next(error);
  }
}

async function trendingTopics(req, res, next) {
  try {
    const topics = await getTrendingTopics(req.query);
    res.status(200).send({ topics });
  } catch (error) {
    next(error);
  }
}

async function followTopicController(req, res, next) {
  try {
    await followTopic(req.user.username, req.params.slug);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function unfollowTopicController(req, res, next) {
  try {
    await unfollowTopic(req.user.username, req.params.slug);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function topicFollowStatus(req, res, next) {
  try {
    const result = await getTopicFollowStatus(
      req.user.username,
      req.params.slug
    );
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}

async function followedTopics(req, res, next) {
  try {
    const topics = await getFollowedTopics(req.user.username);
    res.status(200).send({ topics });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  articleRecommendations,
  followedTopics,
  followTopicController,
  topicFollowStatus,
  trendingArticles,
  trendingTopics,
  unfollowTopicController,
};
