const db = require("../db/connection");
const { parsePositiveId, parsePositiveIntegerQuery, badRequest } = require("../utils/validation");

function parseLimit(value, fallback = 10, max = 50) {
  if (value === undefined) return fallback;
  return parsePositiveIntegerQuery(value, "limit", max);
}

async function getTrendingArticles({ limit } = {}) {
  const parsedLimit = parseLimit(limit, 10, 30);

  const { rows } = await db.query(
    `SELECT a.author, a.title, a.article_id, a.topic, a.created_at, a.updated_at,
            a.votes, a.article_img_url, COUNT(c.comment_id)::int AS comment_count,
            (
              GREATEST(a.votes, 0) * 2
              + COUNT(c.comment_id) * 3
              + CASE
                  WHEN a.created_at >= NOW() - INTERVAL '7 days' THEN 8
                  WHEN a.created_at >= NOW() - INTERVAL '30 days' THEN 3
                  ELSE 0
                END
            )::float AS hot_score
     FROM articles a
     LEFT JOIN comments c
       ON c.article_id = a.article_id AND c.deleted_at IS NULL
     WHERE a.status = 'published' AND a.deleted_at IS NULL
     GROUP BY a.article_id
     ORDER BY hot_score DESC, a.created_at DESC
     LIMIT $1;`,
    [parsedLimit]
  );

  return rows;
}

async function getArticleRecommendations(articleIdInput, { limit } = {}) {
  const articleId = parsePositiveId(articleIdInput);
  const parsedLimit = parseLimit(limit, 5, 12);

  const source = await db.query(
    `SELECT article_id, topic, author
     FROM articles
     WHERE article_id = $1 AND status = 'published' AND deleted_at IS NULL;`,
    [articleId]
  );

  if (!source.rows.length) throw { status: 404, msg: "Not Found" };

  const { topic, author } = source.rows[0];

  const { rows } = await db.query(
    `SELECT a.author, a.title, a.article_id, a.topic, a.created_at, a.updated_at,
            a.votes, a.article_img_url, COUNT(c.comment_id)::int AS comment_count,
            (
              CASE WHEN a.topic = $2 THEN 5 ELSE 0 END
              + CASE WHEN a.author = $3 THEN 2 ELSE 0 END
              + LEAST(GREATEST(a.votes, 0), 20) * 0.1
              + LEAST(COUNT(c.comment_id), 20) * 0.15
            )::float AS recommendation_score
     FROM articles a
     LEFT JOIN comments c
       ON c.article_id = a.article_id AND c.deleted_at IS NULL
     WHERE a.article_id <> $1
       AND a.status = 'published'
       AND a.deleted_at IS NULL
     GROUP BY a.article_id
     ORDER BY recommendation_score DESC, a.created_at DESC
     LIMIT $4;`,
    [articleId, topic, author, parsedLimit]
  );

  return rows;
}

async function getTrendingTopics({ limit } = {}) {
  const parsedLimit = parseLimit(limit, 8, 30);

  const { rows } = await db.query(
    `SELECT t.slug, t.description,
            COUNT(DISTINCT a.article_id)::int AS article_count,
            COUNT(c.comment_id)::int AS comment_count,
            (
              COUNT(DISTINCT a.article_id) * 3
              + COUNT(c.comment_id)
            )::int AS trend_score
     FROM topics t
     LEFT JOIN articles a
       ON a.topic = t.slug
      AND a.status = 'published'
      AND a.deleted_at IS NULL
     LEFT JOIN comments c
       ON c.article_id = a.article_id
      AND c.deleted_at IS NULL
     GROUP BY t.slug
     ORDER BY trend_score DESC, t.slug ASC
     LIMIT $1;`,
    [parsedLimit]
  );

  return rows;
}

async function ensureTopic(slug) {
  if (typeof slug !== "string" || !slug.trim()) throw badRequest();
  const { rows } = await db.query(
    "SELECT slug FROM topics WHERE slug = $1;",
    [slug.trim()]
  );
  if (!rows.length) throw { status: 404, msg: "Not Found" };
  return rows[0].slug;
}

async function followTopic(username, slugInput) {
  const slug = await ensureTopic(slugInput);
  await db.query(
    `INSERT INTO topic_follows (username, topic_slug)
     VALUES ($1, $2)
     ON CONFLICT (username, topic_slug) DO NOTHING;`,
    [username, slug]
  );
}

async function unfollowTopic(username, slugInput) {
  const slug = await ensureTopic(slugInput);
  await db.query(
    "DELETE FROM topic_follows WHERE username = $1 AND topic_slug = $2;",
    [username, slug]
  );
}

async function getTopicFollowStatus(username, slugInput) {
  const slug = await ensureTopic(slugInput);
  const { rows } = await db.query(
    "SELECT 1 FROM topic_follows WHERE username = $1 AND topic_slug = $2;",
    [username, slug]
  );
  return { following: rows.length > 0 };
}

async function getFollowedTopics(username) {
  const { rows } = await db.query(
    `SELECT t.slug, t.description, tf.created_at AS followed_at
     FROM topic_follows tf
     JOIN topics t ON t.slug = tf.topic_slug
     WHERE tf.username = $1
     ORDER BY tf.created_at DESC;`,
    [username]
  );
  return rows;
}

module.exports = {
  followTopic,
  getArticleRecommendations,
  getFollowedTopics,
  getTopicFollowStatus,
  getTrendingArticles,
  getTrendingTopics,
  unfollowTopic,
};
