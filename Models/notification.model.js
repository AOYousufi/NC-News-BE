const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

async function createNotification(
  {
    recipient,
    actor,
    type,
    articleId = null,
    commentId = null,
  },
  queryable = db
) {
  if (!recipient || recipient === actor) return null;

  const { rows } = await queryable.query(
    `INSERT INTO notifications
      (recipient_username, actor_username, type, article_id, comment_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *;`,
    [recipient, actor, type, articleId, commentId]
  );

  return rows[0];
}

async function getNotifications(username, { unreadOnly = false } = {}) {
  const values = [username];
  let where = "n.recipient_username = $1";

  if (unreadOnly) {
    where += " AND n.read_at IS NULL";
  }

  const { rows } = await db.query(
    `SELECT n.notification_id, n.type, n.article_id, n.comment_id,
            n.created_at, n.read_at,
            u.username AS actor_username, u.name AS actor_name,
            u.avatar_url AS actor_avatar_url,
            a.title AS article_title
     FROM notifications n
     JOIN users u ON u.username = n.actor_username
     LEFT JOIN articles a ON a.article_id = n.article_id
     WHERE ${where}
     ORDER BY n.created_at DESC
     LIMIT 100;`,
    values
  );

  return rows;
}

async function getUnreadNotificationCount(username) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM notifications
     WHERE recipient_username = $1 AND read_at IS NULL;`,
    [username]
  );

  return rows[0].count;
}

async function markNotificationRead(username, notificationIdInput) {
  const notificationId = parsePositiveId(notificationIdInput);

  const { rows } = await db.query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE notification_id = $1 AND recipient_username = $2
     RETURNING notification_id, read_at;`,
    [notificationId, username]
  );

  if (!rows.length) throw { status: 404, msg: "Not Found" };
  return rows[0];
}

async function markAllNotificationsRead(username) {
  await db.query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE recipient_username = $1;`,
    [username]
  );
}

module.exports = {
  createNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
};
