const db = require("../db/connection");

async function logModeratorAction(
  moderator,
  action,
  targetType,
  targetId = null,
  details = {},
  queryable = db
) {
  const { rows } = await queryable.query(
    `INSERT INTO moderator_audit_log
      (moderator_username, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *;`,
    [moderator, action, targetType, targetId, JSON.stringify(details)]
  );

  return rows[0];
}

async function getModeratorAuditLog({ limit = 100 } = {}) {
  const parsedLimit = Math.min(Math.max(Number(limit) || 100, 1), 250);

  const { rows } = await db.query(
    `SELECT audit_id, moderator_username, action, target_type, target_id,
            details, created_at
     FROM moderator_audit_log
     ORDER BY created_at DESC
     LIMIT $1;`,
    [parsedLimit]
  );

  return rows;
}

async function getAdminAnalytics() {
  const counts = await db.query(
    `SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM articles
       WHERE status = 'published' AND deleted_at IS NULL) AS published_articles,
      (SELECT COUNT(*)::int FROM articles
       WHERE status = 'draft' AND deleted_at IS NULL) AS drafts,
      (SELECT COUNT(*)::int FROM comments
       WHERE deleted_at IS NULL) AS comments,
      (SELECT COUNT(*)::int FROM reports
       WHERE status = 'open') AS open_reports,
      (SELECT COUNT(*)::int
       FROM saved_articles sa
       JOIN articles a ON a.article_id = sa.article_id
       WHERE a.status = 'published' AND a.deleted_at IS NULL) AS saved_articles,
      (SELECT COUNT(*)::int FROM user_follows) AS user_follows,
      (SELECT COUNT(*)::int FROM topic_follows) AS topic_follows,
      (SELECT COUNT(*)::int FROM collections) AS collections;`
  );

  const topTopics = await db.query(
    `SELECT t.slug,
            COUNT(DISTINCT a.article_id)::int AS articles,
            COUNT(c.comment_id)::int AS comments
     FROM topics t
     LEFT JOIN articles a
       ON a.topic = t.slug
      AND a.status = 'published'
      AND a.deleted_at IS NULL
     LEFT JOIN comments c
       ON c.article_id = a.article_id
      AND c.deleted_at IS NULL
     GROUP BY t.slug
     ORDER BY (COUNT(DISTINCT a.article_id) * 3 + COUNT(c.comment_id)) DESC,
              t.slug ASC
     LIMIT 8;`
  );

  const activeUsers = await db.query(
    `SELECT u.username, u.name,
            (
              (SELECT COUNT(*) FROM articles a
               WHERE a.author = u.username
                 AND a.status = 'published'
                 AND a.deleted_at IS NULL) * 3
              +
              (SELECT COUNT(*) FROM comments c
               WHERE c.author = u.username
                 AND c.deleted_at IS NULL)
            )::int AS contribution_score
     FROM users u
     ORDER BY contribution_score DESC, u.username ASC
     LIMIT 8;`
  );

  return {
    counts: counts.rows[0],
    top_topics: topTopics.rows,
    active_users: activeUsers.rows,
  };
}

module.exports = {
  getAdminAnalytics,
  getModeratorAuditLog,
  logModeratorAction,
};
