const db = require("../db/connection");
const { parsePositiveId, badRequest } = require("../utils/validation");

async function update_Article(articleIdInput, incVotes, username) {
  const articleId = parsePositiveId(articleIdInput);

  if (incVotes !== 1 && incVotes !== -1) {
    throw badRequest();
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const articleResult = await client.query(
      "SELECT author FROM articles WHERE article_id = $1 FOR UPDATE;",
      [articleId]
    );

    if (articleResult.rows.length === 0) {
      throw { status: 404, msg: "Not Found" };
    }

    if (articleResult.rows[0].author === username) {
      throw { status: 403, msg: "You cannot vote on your own article" };
    }

    const voteResult = await client.query(
      `SELECT vote_value
       FROM article_votes
       WHERE username = $1 AND article_id = $2;`,
      [username, articleId]
    );

    const previousVote = voteResult.rows[0]?.vote_value || 0;
    const nextVote = previousVote === incVotes ? 0 : incVotes;
    const voteDelta = nextVote - previousVote;

    if (nextVote === 0) {
      await client.query(
        "DELETE FROM article_votes WHERE username = $1 AND article_id = $2;",
        [username, articleId]
      );
    } else {
      await client.query(
        `INSERT INTO article_votes (username, article_id, vote_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (username, article_id)
         DO UPDATE SET vote_value = EXCLUDED.vote_value;`,
        [username, articleId, nextVote]
      );
    }

    const { rows } = await client.query(
      `UPDATE articles
       SET votes = votes + $1
       WHERE article_id = $2
       RETURNING *;`,
      [voteDelta, articleId]
    );

    await client.query("COMMIT");

    return { ...rows[0], user_vote: nextVote };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getUserArticleVote(articleIdInput, username) {
  const articleId = parsePositiveId(articleIdInput);

  const articleResult = await db.query(
    "SELECT author FROM articles WHERE article_id = $1;",
    [articleId]
  );

  if (articleResult.rows.length === 0) {
    throw { status: 404, msg: "Not Found" };
  }

  const { rows } = await db.query(
    `SELECT vote_value
     FROM article_votes
     WHERE username = $1 AND article_id = $2;`,
    [username, articleId]
  );

  return {
    vote: rows[0]?.vote_value || 0,
    can_vote: articleResult.rows[0].author !== username,
  };
}

module.exports = { update_Article, getUserArticleVote };
