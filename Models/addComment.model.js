const db = require("../db/connection");

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return Promise.reject({ status: 400, msg: "Bad Request" });
  }
  return Promise.resolve(id);
}

async function addComment(username, body, articleIdInput) {
  const articleId = await parseId(articleIdInput);
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
