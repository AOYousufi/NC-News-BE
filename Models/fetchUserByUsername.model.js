const db = require("../db/connection");

async function fetchUser(username) {
  const { rows } = await db.query(
    `SELECT u.username, u.name, u.avatar_url, u.bio, u.pinned_article_id,
            a.title AS pinned_article_title,
            a.topic AS pinned_article_topic,
            a.article_img_url AS pinned_article_img_url
     FROM users u
     LEFT JOIN articles a
       ON a.article_id = u.pinned_article_id
      AND a.status = 'published'
      AND a.deleted_at IS NULL
     WHERE u.username = $1;`,
    [username]
  );
  return rows[0];
}

module.exports = fetchUser;
