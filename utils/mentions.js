const db = require("../db/connection");
const { createNotification } = require("../Models/notification.model");

function extractMentions(body) {
  if (typeof body !== "string") return [];

  const usernames = new Set();
  // Match mentions after whitespace or punctuation, but not inside emails or @@names.
  // A lookahead prevents shortening usernames ending in hyphens or over 30 chars.
  const regex = /(^|[^A-Za-z0-9_@])@([A-Za-z0-9_-]{3,30})(?![A-Za-z0-9_-])/g;
  let match;

  while ((match = regex.exec(body)) !== null) {
    usernames.add(match[2]);
  }

  return [...usernames];
}

async function createMentionNotifications({
  body,
  actor,
  articleId,
  commentId,
  queryable = db,
}) {
  const mentions = extractMentions(body).filter((username) => username !== actor);
  if (!mentions.length) return [];

  const { rows } = await queryable.query(
    "SELECT username FROM users WHERE username = ANY($1::varchar[]);",
    [mentions]
  );

  const notifications = [];

  for (const user of rows) {
    const notification = await createNotification(
      {
        recipient: user.username,
        actor,
        type: "mention",
        articleId,
        commentId,
      },
      queryable
    );

    if (notification) notifications.push(notification);
  }

  return notifications;
}

module.exports = { createMentionNotifications, extractMentions };
