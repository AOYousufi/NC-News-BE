const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

async function deleteArticle(articleIdInput, username) {
  const articleId = parsePositiveId(articleIdInput);
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE articles
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE article_id = $1
         AND author = $2
         AND deleted_at IS NULL
       RETURNING article_id;`,
      [articleId, username]
    );

    if (!rows.length) {
      const existing = await client.query(
        "SELECT author, deleted_at FROM articles WHERE article_id = $1;",
        [articleId]
      );

      if (!existing.rows.length || existing.rows[0].deleted_at) {
        throw { status: 404, msg: "Not Found" };
      }

      throw { status: 403, msg: "Forbidden" };
    }

    await client.query(
      `UPDATE users
       SET pinned_article_id = NULL
       WHERE pinned_article_id = $1;`,
      [articleId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = deleteArticle;
