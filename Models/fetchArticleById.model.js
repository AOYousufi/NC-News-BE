const db = require("../db/connection");

function getArticle(articleIdInput) {
  const articleId = Number(articleIdInput);
  if (!Number.isInteger(articleId) || articleId < 1) {
    return Promise.reject({ status: 400, msg: "Bad Request" });
  }

  return db.query(
    "SELECT articles.*, COUNT(comments.comment_id)::int AS comment_count FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id WHERE articles.article_id = $1 GROUP BY articles.article_id;",
    [articleId]
  );
}

module.exports = getArticle;
