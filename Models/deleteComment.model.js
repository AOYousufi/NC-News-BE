const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

async function deleteComment(commentIdInput, username) {
  const commentId = parsePositiveId(commentIdInput);

  const { rows } = await db.query(
    `UPDATE comments
     SET body = '[deleted]', deleted_at = NOW(), updated_at = NOW()
     WHERE comment_id = $1
       AND author = $2
       AND deleted_at IS NULL
     RETURNING comment_id;`,
    [commentId, username]
  );

  if (rows.length) return;

  const existing = await db.query(
    "SELECT author, deleted_at FROM comments WHERE comment_id = $1;",
    [commentId]
  );

  if (!existing.rows.length || existing.rows[0].deleted_at) {
    throw { status: 404, msg: "Not Found" };
  }

  throw { status: 403, msg: "Forbidden" };
}

module.exports = deleteComment;
