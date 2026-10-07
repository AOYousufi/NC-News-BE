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
  return value.trim();
}

function validateSearch(value) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw badRequest("Invalid search value");
  const search = value.trim();
  if (search.length < 2 || search.length > 120) {
    throw badRequest("Invalid search value");
  }
  return search;
}

async function ensureFilterExists(table, column, value) {
  const { rows } = await db.query(
    "SELECT 1 FROM " + table + " WHERE " + column + " = $1 LIMIT 1;",
    [value]
  );
  if (rows.length === 0) {
    throw { status: 404, msg: "Not Found" };
  }
}

async function fetchAllArticles(options = {}) {
  const sortBy = options.sort_by === undefined ? "created_at" : options.sort_by;
  const orderInput = options.order === undefined ? "desc" : options.order;

  if (typeof sortBy !== "string" || !SORT_COLUMNS[sortBy]) {
    throw { status: 400, msg: "Invalid sort_by column" };
  }
  if (typeof orderInput !== "string") {
    throw { status: 400, msg: "Invalid order value" };
  }

  const order = orderInput.toLowerCase();
  if (!["asc", "desc"].includes(order)) {
    throw { status: 400, msg: "Invalid order value" };
  }

  const topic = validateFilter(options.topic, "topic");
  const author = validateFilter(options.author, "author");
  const search = validateSearch(options.search);
  const requestedLimit = parsePositiveIntegerQuery(options.limit, "limit", 100);
  const requestedPage = parsePositiveIntegerQuery(options.p, "page");

  if (topic) await ensureFilterExists("topics", "slug", topic);
  if (author) await ensureFilterExists("users", "username", author);

  const filterValues = [];
  const where = ["articles.status = 'published'"];

  if (topic) {
    filterValues.push(topic);
    where.push("articles.topic = $" + filterValues.length);
  }
  if (author) {
    filterValues.push(author);
    where.push("articles.author = $" + filterValues.length);
  }
  if (search) {
    filterValues.push("%" + search + "%");
    const searchParam = "$" + filterValues.length;
    where.push(
      `(articles.title ILIKE ${searchParam} OR articles.body ILIKE ${searchParam} OR articles.author ILIKE ${searchParam})`
    );
  }

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total_count
     FROM articles
     WHERE ${where.join(" AND ")};`,
    filterValues
  );

  const totalCount = countResult.rows[0].total_count;
  const paginationRequested =
    requestedLimit !== undefined || requestedPage !== undefined;
  const limit = paginationRequested ? requestedLimit || 10 : null;
  const page = paginationRequested ? requestedPage || 1 : 1;
  const totalPages = limit ? Math.ceil(totalCount / limit) : totalCount ? 1 : 0;

  const values = [...filterValues];

  let query =
    "SELECT articles.author, articles.title, articles.article_id, articles.topic, articles.created_at, articles.updated_at, articles.votes, articles.article_img_url, COUNT(comments.comment_id)::int AS comment_count FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id";

  query += " WHERE " + where.join(" AND ");
  query += " GROUP BY articles.article_id";
  query += " ORDER BY " + SORT_COLUMNS[sortBy] + " " + order.toUpperCase();

  if (limit) {
    values.push(limit);
    query += " LIMIT $" + values.length;
    values.push((page - 1) * limit);
    query += " OFFSET $" + values.length;
  }

  query += ";";
  const { rows } = await db.query(query, values);

  return {
    articles: rows,
    pagination: {
      total_count: totalCount,
      page,
      limit,
      total_pages: totalPages,
      has_previous: page > 1,
      has_next: limit ? page < totalPages : false,
    },
  };
}

module.exports = { fetchAllArticles };
