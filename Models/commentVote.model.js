const db = require("../db/connection");
const { parsePositiveId, badRequest } = require("../utils/validation");

async function updateCommentVote(commentIdInput, incVotes, username) {
  const commentId = parsePositiveId(commentIdInput);

  if (incVotes !== 1 && incVotes !== -1) throw badRequest();

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const commentResult = await client.query(
      "SELECT author FROM comments WHERE comment_id = $1 FOR UPDATE;",
      [commentId]
    );

    if (!commentResult.rows.length) {
      throw { status: 404, msg: "Not Found" };
    }

    if (commentResult.rows[0].author === username) {
      throw { status: 403, msg: "You cannot vote on your own comment" };
    }

    const voteResult = await client.query(
      `SELECT vote_value
       FROM comment_votes
       WHERE username = $1 AND comment_id = $2;`,
      [username, commentId]
    );

    const previousVote = voteResult.rows[0]?.vote_value || 0;
    const nextVote = previousVote === incVotes ? 0 : incVotes;
    const delta = nextVote - previousVote;

    if (nextVote === 0) {
      await client.query(
        "DELETE FROM comment_votes WHERE username = $1 AND comment_id = $2;",
        [username, commentId]
      );
    } else {
      await client.query(
        `INSERT INTO comment_votes (username, comment_id, vote_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (username, comment_id)
         DO UPDATE SET vote_value = EXCLUDED.vote_value;`,
        [username, commentId, nextVote]
      );
    }

    const { rows } = await client.query(
      `UPDATE comments
       SET votes = votes + $1
       WHERE comment_id = $2
       RETURNING *;`,
      [delta, commentId]
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

async function getCommentVotesForArticle(articleIdInput, username) {
  const articleId = parsePositiveId(articleIdInput);

  const article = await db.query(
    "SELECT article_id FROM articles WHERE article_id = $1 AND status = 'published';",
    [articleId]
  );

  if (!article.rows.length) throw { status: 404, msg: "Not Found" };

  const { rows } = await db.query(
    `SELECT c.comment_id,
            CASE WHEN c.author = $2 THEN false ELSE true END AS can_vote,
            COALESCE(cv.vote_value, 0)::int AS vote
     FROM comments c
     LEFT JOIN comment_votes cv
       ON cv.comment_id = c.comment_id AND cv.username = $2
     WHERE c.article_id = $1;`,
    [articleId, username]
  );

  return rows;
}

module.exports = { getCommentVotesForArticle, updateCommentVote };
