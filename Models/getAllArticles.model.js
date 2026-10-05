const db = require("../db/connection");

const SORT_COLUMNS = {
  author: "articles.author",
  title: "articles.title",
  article_id: "articles.article_id",
  topic: "articles.topic",
  created_at: "articles.created_at",
  votes: "articles.votes",
  article_img_url: "articles.article_img_url",
  comment_count: "comment_count",
};

function parsePositiveInteger(value, field, max) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || (max && parsed > max)) {
    return Promise.reject({ status: 400, msg: "Invalid " + field + " value" });
  }
  return parsed;
}

async function ensureFilterExists(table, column, value) {
  const { rows } = await db.query(
    "SELECT 1 FROM " + table + " WHERE " + column + " = $1 LIMIT 1;",
    [value]
  );
  if (rows.length === 0) {
    return Promise.reject({ status: 404, msg: "Not Found" });
  }
}

async function fetchAllArticles(options = {}) {
  const sortBy = options.sort_by || "created_at";
  const order = (options.order || "desc").toLowerCase();

  if (!SORT_COLUMNS[sortBy]) {
    return Promise.reject({ status: 400, msg: "Invalid sort_by column" });
  }
  if (!["asc", "desc"].includes(order)) {
    return Promise.reject({ status: 400, msg: "Invalid order value" });
  }

  const limit = await parsePositiveInteger(options.limit, "limit", 100);
  const page = await parsePositiveInteger(options.p, "page");

  if (options.topic) await ensureFilterExists("topics", "slug", options.topic);
  if (options.author) await ensureFilterExists("users", "username", options.author);

  const values = [];
  const where = [];

  if (options.topic) {
    values.push(options.topic);
    where.push("articles.topic = $" + values.length);
  }
  if (options.author) {
    values.push(options.author);
    where.push("articles.author = $" + values.length);
  }

  let query =
    "SELECT articles.author, articles.title, articles.article_id, articles.topic, articles.created_at, articles.votes, articles.article_img_url, COUNT(comments.comment_id)::int AS comment_count FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id";

  if (where.length) query += " WHERE " + where.join(" AND ");
  query += " GROUP BY articles.article_id";
  query += " ORDER BY " + SORT_COLUMNS[sortBy] + " " + order.toUpperCase();

  if (limit !== undefined || page !== undefined) {
    const effectiveLimit = limit || 10;
    const effectivePage = page || 1;
    values.push(effectiveLimit);
    query += " LIMIT $" + values.length;
    values.push((effectivePage - 1) * effectiveLimit);
    query += " OFFSET $" + values.length;
  }

  query += ";";
  const { rows } = await db.query(query, values);
  return rows;
}

module.exports = { fetchAllArticles };
