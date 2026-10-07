const db = require("../db/connection");
const { parsePositiveId, badRequest } = require("../utils/validation");
const { createNotification } = require("./notification.model");

async function addComment(username, body, articleIdInput, parentCommentIdInput) {
  const articleId = parsePositiveId(articleIdInput);

  const articleResult = await db.query(
    "SELECT article_id, author FROM articles WHERE article_id = $1 AND status = 'published';",
    [articleId]
  );

  if (articleResult.rows.length === 0) {
    throw { status: 404, msg: "Not Found" };
  }

  let parentCommentId = null;
  let parentAuthor = null;

  if (parentCommentIdInput !== undefined && parentCommentIdInput !== null) {
    parentCommentId = parsePositiveId(parentCommentIdInput);

    const parentResult = await db.query(
      `SELECT comment_id, article_id, author
       FROM comments
       WHERE comment_id = $1;`,
      [parentCommentId]
    );

    if (!parentResult.rows.length) {
      throw { status: 404, msg: "Parent comment not found" };
    }

    if (parentResult.rows[0].article_id !== articleId) {
      throw badRequest("Reply must belong to the same article");
    }

    parentAuthor = parentResult.rows[0].author;
  }

  const { rows } = await db.query(
    `INSERT INTO comments (article_id, author, body, parent_comment_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *;`,
    [articleId, username, body, parentCommentId]
  );

  const comment = rows[0];
  const articleAuthor = articleResult.rows[0].author;

  if (parentAuthor) {
    await createNotification({
      recipient: parentAuthor,
      actor: username,
      type: "reply",
      articleId,
      commentId: comment.comment_id,
    });
  }

  if (!parentAuthor || parentAuthor !== articleAuthor) {
    await createNotification({
      recipient: articleAuthor,
      actor: username,
      type: "article_comment",
      articleId,
      commentId: comment.comment_id,
    });
  }

  return comment;
}

module.exports = { addComment };
