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

  const ownerResult = await db.query(
    "SELECT author FROM articles WHERE article_id = $1;",
    [articleId]
  );

  if (ownerResult.rows.length === 0) {
    throw { status: 404, msg: "Not Found" };
  }

  if (ownerResult.rows[0].author !== username) {
    throw { status: 403, msg: "Forbidden" };
  }

  const entries = Object.entries(updates);
  const values = entries.map(([, value]) => value);
  const setClause = entries
    .map(([field], index) => COLUMN_BY_FIELD[field] + " = $" + (index + 1))
    .join(", ");

  values.push(articleId);

  const { rows } = await db.query(
    `UPDATE articles
     SET ${setClause}, updated_at = NOW()
     WHERE article_id = $${values.length}
     RETURNING *;`,
    values
  );

  const countResult = await db.query(
    "SELECT COUNT(*)::int AS comment_count FROM comments WHERE article_id = $1;",
    [articleId]
  );

  return {
    ...rows[0],
    comment_count: countResult.rows[0].comment_count,
  };
}

module.exports = editArticle;
