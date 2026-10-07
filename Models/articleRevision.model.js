const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

async function getArticleRevisions(articleIdInput, username) {
  const articleId = parsePositiveId(articleIdInput);

  const owner = await db.query(
    "SELECT author FROM articles WHERE article_id = $1;",
    [articleId]
  );

  if (!owner.rows.length) throw { status: 404, msg: "Not Found" };
  if (owner.rows[0].author !== username) {
    throw { status: 403, msg: "Forbidden" };
  }

  const { rows } = await db.query(
    `SELECT revision_id, article_id, editor_username, title, topic, body,
            article_img_url, status, created_at
     FROM article_revisions
     WHERE article_id = $1
     ORDER BY created_at DESC, revision_id DESC;`,
    [articleId]
  );

  return rows;
}

module.exports = getArticleRevisions;
