const db = require("../db/connection");

async function getCurrentUser(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT u.username, u.name, u.avatar_url, u.bio, u.pinned_article_id, u.role,
              a.title AS pinned_article_title,
              a.topic AS pinned_article_topic,
              a.article_img_url AS pinned_article_img_url
       FROM users u
       LEFT JOIN articles a
         ON a.article_id = u.pinned_article_id
        AND a.status = 'published'
        AND a.deleted_at IS NULL
       WHERE u.username = $1;`,
      [req.user.username]
    );
    const user = rows[0];
    if (!user) return next({ status: 401, msg: "Invalid user" });
    res.status(200).send({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = getCurrentUser;
