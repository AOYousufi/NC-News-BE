const db = require("../db/connection");
const { parsePositiveId, badRequest } = require("../utils/validation");

async function update_Article(articleIdInput, incVotes) {
  const articleId = parsePositiveId(articleIdInput);
  if (!Number.isSafeInteger(incVotes)) {
    return Promise.reject(badRequest());
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
