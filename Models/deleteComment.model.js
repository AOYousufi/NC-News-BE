const db = require("../db/connection");

async function deleteComment(commentIdInput, username) {
  const commentId = Number(commentIdInput);
  if (!Number.isInteger(commentId) || commentId < 1) {
    return Promise.reject({ status: 400, msg: "Bad Request" });
  }

  const { rows } = await db.query(
    "SELECT author FROM comments WHERE comment_id = $1;",
    [commentId]
  );

  if (rows.length === 0) {
    return Promise.reject({ status: 404, msg: "Not Found" });
  }

  if (rows[0].author !== username) {
    return Promise.reject({ status: 403, msg: "Forbidden" });
  }

  await db.query("DELETE FROM comments WHERE comment_id = $1;", [commentId]);
}

module.exports = deleteComment;
