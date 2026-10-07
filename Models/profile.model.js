const db = require("../db/connection");

async function getPublicProfileStats(username) {
  const user = await db.query(
    "SELECT username FROM users WHERE username = $1;",
    [username]
  );

  if (!user.rows.length) throw { status: 404, msg: "User Not Found" };

  const { rows } = await db.query(
    `SELECT
      (SELECT COUNT(*)::int FROM articles
       WHERE author = $1 AND status = 'published') AS articles,
      (SELECT COUNT(*)::int FROM comments
       WHERE author = $1) AS comments,
      (SELECT COUNT(*)::int FROM user_follows
       WHERE followed_username = $1) AS followers,
      (SELECT COUNT(*)::int FROM user_follows
       WHERE follower_username = $1) AS following,
      COALESCE((SELECT SUM(votes)::int FROM articles
       WHERE author = $1 AND status = 'published'), 0) AS article_votes_received,
      COALESCE((SELECT SUM(votes)::int FROM comments
       WHERE author = $1), 0) AS comment_votes_received;`,
    [username]
  );

  return rows[0];
}

module.exports = { getPublicProfileStats };
