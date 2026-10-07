const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

const COLUMN_BY_FIELD = {
  title: "title",
  topic: "topic",
  body: "body",
  article_img_url: "article_img_url",
  status: "status",
};

async function editArticle(articleIdInput, username, updates) {
  const articleId = parsePositiveId(articleIdInput);
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const ownerResult = await client.query(
      "SELECT * FROM articles WHERE article_id = $1 FOR UPDATE;",
      [articleId]
    );

    if (ownerResult.rows.length === 0) {
      throw { status: 404, msg: "Not Found" };
    }

    const previous = ownerResult.rows[0];

    if (previous.author !== username) {
      throw { status: 403, msg: "Forbidden" };
    }

    await client.query(
      `INSERT INTO article_revisions
        (article_id, editor_username, title, topic, body, article_img_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [
        articleId,
        username,
        previous.title,
        previous.topic,
        previous.body,
        previous.article_img_url,
        previous.status,
      ]
    );

    const entries = Object.entries(updates);
    const values = entries.map(([, value]) => value);
    const setClause = entries
      .map(([field], index) => COLUMN_BY_FIELD[field] + " = $" + (index + 1))
      .join(", ");

    values.push(articleId);

    const { rows } = await client.query(
      `UPDATE articles
       SET ${setClause}, updated_at = NOW()
       WHERE article_id = $${values.length}
       RETURNING *;`,
      values
    );

    const countResult = await client.query(
      "SELECT COUNT(*)::int AS comment_count FROM comments WHERE article_id = $1;",
      [articleId]
    );

    await client.query("COMMIT");

    return {
      ...rows[0],
      comment_count: countResult.rows[0].comment_count,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = editArticle;
