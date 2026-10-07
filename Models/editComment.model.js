const db = require("../db/connection");
const { parsePositiveId, badRequest } = require("../utils/validation");

async function editComment(commentIdInput, username, body) {
  const commentId = parsePositiveId(commentIdInput);

  if (typeof body !== "string" || body.trim().length === 0) {
    throw badRequest();
  }

  const cleaned = body.trim();
  if (cleaned.length > 10000) throw badRequest();

  const owner = await db.query(
    "SELECT author FROM comments WHERE comment_id = $1;",
    [commentId]
  );

  if (!owner.rows.length) throw { status: 404, msg: "Not Found" };
  if (owner.rows[0].author !== username) {
    throw { status: 403, msg: "Forbidden" };
  }

  const { rows } = await db.query(
    `UPDATE comments
     SET body = $1, updated_at = NOW()
     WHERE comment_id = $2
     RETURNING *;`,
    [cleaned, commentId]
  );

  return rows[0];
}

module.exports = editComment;
