const db = require("../db/connection");
const { parsePositiveId, badRequest } = require("../utils/validation");

const VALID_REACTIONS = new Set(["insightful", "useful", "funny"]);

async function ensureReactionArticle(articleIdInput) {
  const articleId = parsePositiveId(articleIdInput);
  const { rows } = await db.query(
    `SELECT article_id, author
     FROM articles
     WHERE article_id = $1
       AND status = 'published'
       AND deleted_at IS NULL;`,
    [articleId]
  );

  if (!rows.length) throw { status: 404, msg: "Not Found" };
  return rows[0];
}

async function getReactionSummary(articleIdInput) {
  const article = await ensureReactionArticle(articleIdInput);

  const { rows } = await db.query(
    `SELECT reaction, COUNT(*)::int AS count
     FROM article_reactions
     WHERE article_id = $1
     GROUP BY reaction;`,
    [article.article_id]
  );

  const counts = { insightful: 0, useful: 0, funny: 0 };
  rows.forEach((row) => {
    counts[row.reaction] = row.count;
  });

  return counts;
}

async function getUserReaction(articleIdInput, username) {
  const article = await ensureReactionArticle(articleIdInput);

  const { rows } = await db.query(
    `SELECT reaction
     FROM article_reactions
     WHERE username = $1 AND article_id = $2;`,
    [username, article.article_id]
  );

  return {
    reaction: rows[0]?.reaction || null,
    can_react: article.author !== username,
  };
}

async function updateReaction(articleIdInput, username, reaction) {
  if (!VALID_REACTIONS.has(reaction)) throw badRequest();

  const article = await ensureReactionArticle(articleIdInput);

  if (article.author === username) {
    throw { status: 403, msg: "You cannot react to your own article" };
  }

  const current = await db.query(
    `SELECT reaction
     FROM article_reactions
     WHERE username = $1 AND article_id = $2;`,
    [username, article.article_id]
  );

  const previous = current.rows[0]?.reaction || null;
  let nextReaction = reaction;

  if (previous === reaction) {
    await db.query(
      "DELETE FROM article_reactions WHERE username = $1 AND article_id = $2;",
      [username, article.article_id]
    );
    nextReaction = null;
  } else {
    await db.query(
      `INSERT INTO article_reactions (username, article_id, reaction)
       VALUES ($1, $2, $3)
       ON CONFLICT (username, article_id)
       DO UPDATE SET reaction = EXCLUDED.reaction, updated_at = NOW();`,
      [username, article.article_id, reaction]
    );
  }

  return {
    reaction: nextReaction,
    counts: await getReactionSummary(article.article_id),
  };
}

module.exports = {
  getReactionSummary,
  getUserReaction,
  updateReaction,
};
