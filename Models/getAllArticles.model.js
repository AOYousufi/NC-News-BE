const db = require("../db/connection");
const { badRequest, parsePositiveIntegerQuery } = require("../utils/validation");

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

function validateFilter(value, field) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 100) {
    throw badRequest(`Invalid ${field} value`);
  }
  return value;
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
  const sortBy = options.sort_by === undefined ? "created_at" : options.sort_by;
  const orderInput = options.order === undefined ? "desc" : options.order;

  if (typeof sortBy !== "string" || !SORT_COLUMNS[sortBy]) {
    return Promise.reject({ status: 400, msg: "Invalid sort_by column" });
  }
  if (typeof orderInput !== "string") {
    return Promise.reject({ status: 400, msg: "Invalid order value" });
  }

  const order = orderInput.toLowerCase();
  if (!["asc", "desc"].includes(order)) {
    return Promise.reject({ status: 400, msg: "Invalid order value" });
  }

  const topic = validateFilter(options.topic, "topic");
  const author = validateFilter(options.author, "author");
  const limit = parsePositiveIntegerQuery(options.limit, "limit", 100);
  const page = parsePositiveIntegerQuery(options.p, "page");

  if (topic) await ensureFilterExists("topics", "slug", topic);
  if (author) await ensureFilterExists("users", "username", author);

  const values = [];
  const where = [];

  if (topic) {
    values.push(topic);
    where.push("articles.topic = $" + values.length);
  }
  if (author) {
    values.push(author);
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
