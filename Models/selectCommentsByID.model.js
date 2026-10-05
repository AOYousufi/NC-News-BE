const db = require("../db/connection");

async function selectCommentsByArticle_ID(articleIdInput) {
  const articleId = Number(articleIdInput);
  if (!Number.isInteger(articleId) || articleId < 1) {
    return Promise.reject({ status: 400, msg: "Bad Request" });
  }

  const articleResult = await db.query(
    "SELECT article_id FROM articles WHERE article_id = $1;",
    [articleId]
  );
  if (articleResult.rows.length === 0) {
    return Promise.reject({ status: 404, msg: "Not Found" });
  }

  const { rows } = await db.query(
    "SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at DESC;",
    [articleId]
  );
  return rows;
}

module.exports = { selectCommentsByArticle_ID };
