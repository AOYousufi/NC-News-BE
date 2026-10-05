const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

async function addComment(username, body, articleIdInput) {
  const articleId = parsePositiveId(articleIdInput);
  const articleResult = await db.query(
    "SELECT article_id FROM articles WHERE article_id = $1;",
    [articleId]
  );

  if (articleResult.rows.length === 0) {
    return Promise.reject({ status: 404, msg: "Not Found" });
  }

  const { rows } = await db.query(
    "INSERT INTO comments (article_id, author, body) VALUES ($1, $2, $3) RETURNING *;",
    [articleId, username, body]
  );

  return rows[0];
}

module.exports = { addComment };
