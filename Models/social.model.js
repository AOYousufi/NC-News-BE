const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");
const { createNotification } = require("./notification.model");


async function ensurePublishedArticle(articleIdInput) {
  const articleId = parsePositiveId(articleIdInput);
  const { rows } = await db.query(
    "SELECT article_id FROM articles WHERE article_id = $1 AND status = 'published';",
    [articleId]
  );

  if (!rows.length) throw { status: 404, msg: "Not Found" };
  return articleId;
}

async function saveArticle(username, articleIdInput) {
  const articleId = await ensurePublishedArticle(articleIdInput);
  await db.query(
    `INSERT INTO saved_articles (username, article_id)
     VALUES ($1, $2)
     ON CONFLICT (username, article_id) DO NOTHING;`,
    [username, articleId]
  );
}

async function unsaveArticle(username, articleIdInput) {
  const articleId = parsePositiveId(articleIdInput);
  await db.query(
    "DELETE FROM saved_articles WHERE username = $1 AND article_id = $2;",
    [username, articleId]
  );
}

async function getSavedArticles(username) {
  const { rows } = await db.query(
    `SELECT a.author, a.title, a.article_id, a.topic, a.created_at, a.updated_at,
            a.votes, a.article_img_url, COUNT(c.comment_id)::int AS comment_count,
            sa.saved_at
     FROM saved_articles sa
     JOIN articles a ON a.article_id = sa.article_id
     LEFT JOIN comments c ON c.article_id = a.article_id
     WHERE sa.username = $1 AND a.status = 'published'
     GROUP BY a.article_id, sa.saved_at
     ORDER BY sa.saved_at DESC;`,
    [username]
  );
  return rows;
}

async function ensureUser(username) {
  const { rows } = await db.query(
    "SELECT username FROM users WHERE username = $1;",
    [username]
  );
  if (!rows.length) throw { status: 404, msg: "User Not Found" };
}

async function followUser(follower, followed) {
  if (follower === followed) {
    throw { status: 400, msg: "You cannot follow yourself" };
  }

  await ensureUser(followed);

  const result = await db.query(
    `INSERT INTO user_follows (follower_username, followed_username)
     VALUES ($1, $2)
     ON CONFLICT (follower_username, followed_username) DO NOTHING
     RETURNING follower_username;`,
    [follower, followed]
  );

  if (result.rowCount > 0) {
    await createNotification({
      recipient: followed,
      actor: follower,
      type: "follow",
    });
  }
}

async function unfollowUser(follower, followed) {
  await db.query(
    `DELETE FROM user_follows
     WHERE follower_username = $1 AND followed_username = $2;`,
    [follower, followed]
  );
}

async function getFollowing(username) {
  const { rows } = await db.query(
    `SELECT u.username, u.name, u.avatar_url, f.created_at AS followed_at
     FROM user_follows f
     JOIN users u ON u.username = f.followed_username
     WHERE f.follower_username = $1
     ORDER BY f.created_at DESC;`,
    [username]
  );
  return rows;
}

async function getFollowStatus(follower, followed) {
  if (follower === followed) return { following: false, is_self: true };
  await ensureUser(followed);

  const { rows } = await db.query(
    `SELECT 1 FROM user_follows
     WHERE follower_username = $1 AND followed_username = $2;`,
    [follower, followed]
  );

  return { following: rows.length > 0, is_self: false };
}

async function getFollowingFeed(username, { limit = 20, page = 1 } = {}) {
  const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const parsedPage = Math.max(Number(page) || 1, 1);

  const { rows } = await db.query(
    `SELECT a.author, a.title, a.article_id, a.topic, a.created_at, a.updated_at,
            a.votes, a.article_img_url, COUNT(c.comment_id)::int AS comment_count
     FROM user_follows f
     JOIN articles a ON a.author = f.followed_username
     LEFT JOIN comments c ON c.article_id = a.article_id
     WHERE f.follower_username = $1 AND a.status = 'published'
     GROUP BY a.article_id
     ORDER BY a.created_at DESC
     LIMIT $2 OFFSET $3;`,
    [username, parsedLimit, (parsedPage - 1) * parsedLimit]
  );

  return rows;
}

async function getActivity(username) {
  const statsResult = await db.query(
    `SELECT
       (SELECT COUNT(*)::int FROM articles WHERE author = $1 AND status = 'published') AS published_articles,
       (SELECT COUNT(*)::int FROM articles WHERE author = $1 AND status = 'draft') AS drafts,
       (SELECT COUNT(*)::int FROM comments WHERE author = $1) AS comments,
       (SELECT COUNT(*)::int FROM saved_articles WHERE username = $1) AS saved_articles,
       (SELECT COUNT(*)::int FROM user_follows WHERE follower_username = $1) AS following;`,
    [username]
  );

  const activityResult = await db.query(
    `SELECT * FROM (
       SELECT 'article' AS type, article_id AS resource_id, title AS label,
              created_at AS occurred_at, NULL::varchar AS secondary
       FROM articles
       WHERE author = $1
       UNION ALL
       SELECT 'comment' AS type, comment_id AS resource_id,
              LEFT(body, 120) AS label, created_at AS occurred_at,
              article_id::varchar AS secondary
       FROM comments
       WHERE author = $1
       UNION ALL
       SELECT 'saved' AS type, sa.article_id AS resource_id,
              a.title AS label, sa.saved_at AS occurred_at, a.author AS secondary
       FROM saved_articles sa
       JOIN articles a ON a.article_id = sa.article_id
       WHERE sa.username = $1
       UNION ALL
       SELECT 'follow' AS type, 0 AS resource_id,
              followed_username AS label, created_at AS occurred_at,
              followed_username AS secondary
       FROM user_follows
       WHERE follower_username = $1
     ) activity
     ORDER BY occurred_at DESC
     LIMIT 30;`,
    [username]
  );

  return { stats: statsResult.rows[0], activity: activityResult.rows };
}

async function getDrafts(username) {
  const { rows } = await db.query(
    `SELECT article_id, title, topic, author, body, created_at, updated_at,
            votes, article_img_url, status
     FROM articles
     WHERE author = $1 AND status = 'draft'
     ORDER BY updated_at DESC, created_at DESC;`,
    [username]
  );
  return rows;
}

async function getManagedArticle(username, articleIdInput) {
  const articleId = parsePositiveId(articleIdInput);
  const { rows } = await db.query(
    `SELECT a.*, COUNT(c.comment_id)::int AS comment_count
     FROM articles a
     LEFT JOIN comments c ON c.article_id = a.article_id
     WHERE a.article_id = $1 AND a.author = $2
     GROUP BY a.article_id;`,
    [articleId, username]
  );

  if (!rows.length) throw { status: 404, msg: "Not Found" };
  return rows[0];
}

module.exports = {
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
};
