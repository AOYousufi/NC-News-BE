const db = require("../db/connection");

async function createArticle(username, article) {
  const values = [article.title, article.topic, username, article.body];
  const columns = ["title", "topic", "author", "body"];
  const placeholders = ["$1", "$2", "$3", "$4"];

  if (article.article_img_url !== undefined) {
    values.push(article.article_img_url);
    columns.push("article_img_url");
    placeholders.push("$" + values.length);
  }

  values.push(article.status || "published");
  columns.push("status");
  placeholders.push("$" + values.length);

  const { rows } = await db.query(
    `INSERT INTO articles (${columns.join(", ")})
     VALUES (${placeholders.join(", ")})
     RETURNING *;`,
    values
  );

  return { ...rows[0], comment_count: 0 };
}

module.exports = createArticle;
