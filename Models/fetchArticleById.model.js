const db = require("../db/connection");
const { parsePositiveId } = require("../utils/validation");

function getArticle(articleIdInput) {
  const articleId = parsePositiveId(articleIdInput);

  return db.query(
    "SELECT articles.*, COUNT(comments.comment_id)::int AS comment_count FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id WHERE articles.article_id = $1 GROUP BY articles.article_id;",
    [articleId]
  );
}

module.exports = getArticle;
