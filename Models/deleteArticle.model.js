const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

async function deleteArticle(articleIdInput, username) {
  const articleId = parsePositiveId(articleIdInput);
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT author FROM articles WHERE article_id = $1 FOR UPDATE;",
      [articleId]
    );

    if (rows.length === 0) {
      throw { status: 404, msg: "Not Found" };
    }

    if (rows[0].author !== username) {
      throw { status: 403, msg: "Forbidden" };
    }

    await client.query("DELETE FROM comments WHERE article_id = $1;", [
      articleId,
    ]);
    await client.query("DELETE FROM articles WHERE article_id = $1;", [
      articleId,
    ]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = deleteArticle;
