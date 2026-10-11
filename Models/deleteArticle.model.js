const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

async function deleteArticle(articleIdInput, username) {
  const articleId = parsePositiveId(articleIdInput);

  const { rows } = await db.query(
    `UPDATE articles
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE article_id = $1
       AND author = $2
       AND deleted_at IS NULL
     RETURNING article_id;`,
    [articleId, username]
  );

  if (rows.length) return;

  const existing = await db.query(
    "SELECT author, deleted_at FROM articles WHERE article_id = $1;",
    [articleId]
  );

  if (!existing.rows.length || existing.rows[0].deleted_at) {
    throw { status: 404, msg: "Not Found" };
  }

  throw { status: 403, msg: "Forbidden" };
}

module.exports = deleteArticle;
