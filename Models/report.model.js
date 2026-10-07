const db = require("../db/connection");
const { parsePositiveId, badRequest } = require("../utils/validation");

const VALID_REASONS = new Set([
  "spam",
  "harassment",
  "misinformation",
  "off-topic",
  "other",
]);

async function createReport(username, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw badRequest();
  }

  const { target_type, target_id, reason, details = "" } = input;

  if (!["article", "comment"].includes(target_type)) throw badRequest();
  if (!VALID_REASONS.has(reason)) throw badRequest();
  if (typeof details !== "string" || details.trim().length > 1000) {
    throw badRequest();
  }

  const targetId = parsePositiveId(target_id);
  let articleId = null;
  let commentId = null;
  let owner = null;

  if (target_type === "article") {
    const { rows } = await db.query(
      "SELECT article_id, author FROM articles WHERE article_id = $1 AND status = 'published';",
      [targetId]
    );
    if (!rows.length) throw { status: 404, msg: "Not Found" };
    articleId = targetId;
    owner = rows[0].author;
  } else {
    const { rows } = await db.query(
      `SELECT c.comment_id, c.author, c.article_id
       FROM comments c
       JOIN articles a ON a.article_id = c.article_id
       WHERE c.comment_id = $1 AND a.status = 'published';`,
      [targetId]
    );
    if (!rows.length) throw { status: 404, msg: "Not Found" };
    commentId = targetId;
    articleId = rows[0].article_id;
    owner = rows[0].author;
  }

  if (owner === username) {
    throw { status: 400, msg: "You cannot report your own content" };
  }

  const { rows } = await db.query(
    `INSERT INTO reports
      (reporter_username, target_type, article_id, comment_id, reason, details)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [username, target_type, articleId, commentId, reason, details.trim()]
  );

  return rows[0];
}

async function listReports({ status = "open" } = {}) {
  if (!["open", "resolved", "dismissed", "all"].includes(status)) {
    throw badRequest();
  }

  const values = [];
  let where = "";

  if (status !== "all") {
    values.push(status);
    where = "WHERE r.status = $1";
  }

  const { rows } = await db.query(
    `SELECT r.*, a.title AS article_title, c.body AS comment_body
     FROM reports r
     LEFT JOIN articles a ON a.article_id = r.article_id
     LEFT JOIN comments c ON c.comment_id = r.comment_id
     ${where}
     ORDER BY CASE WHEN r.status = 'open' THEN 0 ELSE 1 END,
              r.created_at DESC;`,
    values
  );

  return rows;
}

async function reviewReport(reportIdInput, reviewer, status) {
  const reportId = parsePositiveId(reportIdInput);

  if (!["resolved", "dismissed"].includes(status)) throw badRequest();

  const { rows } = await db.query(
    `UPDATE reports
     SET status = $1, reviewer_username = $2, reviewed_at = NOW()
     WHERE report_id = $3
     RETURNING *;`,
    [status, reviewer, reportId]
  );

  if (!rows.length) throw { status: 404, msg: "Not Found" };
  return rows[0];
}

module.exports = { createReport, listReports, reviewReport };
