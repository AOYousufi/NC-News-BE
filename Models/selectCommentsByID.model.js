const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

async function selectCommentsByArticle_ID(articleIdInput) {
  const articleId = parsePositiveId(articleIdInput);

  const articleResult = await db.query(
    `SELECT article_id
     FROM articles
     WHERE article_id = $1
       AND status = 'published'
       AND deleted_at IS NULL;`,
    [articleId]
  );

  if (articleResult.rows.length === 0) {
    throw { status: 404, msg: "Not Found" };
  }

  const { rows } = await db.query(
    `SELECT comment_id,
            CASE WHEN deleted_at IS NULL THEN body ELSE '[deleted]' END AS body,
            article_id, author,
            CASE WHEN deleted_at IS NULL THEN votes ELSE 0 END AS votes,
            created_at, updated_at, parent_comment_id, deleted_at
     FROM comments
     WHERE article_id = $1
     ORDER BY created_at DESC;`,
    [articleId]
  );

  return rows;
}

module.exports = { selectCommentsByArticle_ID };
