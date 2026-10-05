const db = require("../db/connection");

async function update_Article(articleIdInput, incVotes) {
  const articleId = Number(articleIdInput);
  if (!Number.isInteger(articleId) || articleId < 1) {
    return Promise.reject({ status: 400, msg: "Bad Request" });
  }
  if (!Number.isInteger(incVotes)) {
    return Promise.reject({ status: 400, msg: "Bad Request" });
  }

  const { rows } = await db.query(
    "UPDATE articles SET votes = votes + $1 WHERE article_id = $2 RETURNING *;",
    [incVotes, articleId]
  );

  if (rows.length === 0) {
    return Promise.reject({ status: 404, msg: "Not Found" });
  }
  return rows[0];
}

module.exports = { update_Article };
