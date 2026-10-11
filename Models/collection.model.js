const db = require("../db/connection");
const { parsePositiveId, badRequest } = require("../utils/validation");

function validateCollectionInput(input, { partial = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw badRequest();
  }

  const allowed = new Set(["name", "description"]);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw badRequest();
  }

  if (!partial && input.name === undefined) throw badRequest();

  const result = {};

  if (input.name !== undefined) {
    if (typeof input.name !== "string") throw badRequest();
    const name = input.name.trim();
    if (name.length < 1 || name.length > 80) throw badRequest();
    result.name = name;
  }

  if (input.description !== undefined) {
    if (typeof input.description !== "string") throw badRequest();
    const description = input.description.trim();
    if (description.length > 300) throw badRequest();
    result.description = description;
  }

  if (partial && Object.keys(result).length === 0) throw badRequest();

  return result;
}

async function ensureOwnedCollection(username, collectionIdInput) {
  const collectionId = parsePositiveId(collectionIdInput);
  const { rows } = await db.query(
    `SELECT collection_id, username, name, description, created_at, updated_at
     FROM collections
     WHERE collection_id = $1 AND username = $2;`,
    [collectionId, username]
  );

  if (!rows.length) throw { status: 404, msg: "Not Found" };
  return rows[0];
}

async function listCollections(username) {
  const { rows } = await db.query(
    `SELECT c.collection_id, c.name, c.description, c.created_at, c.updated_at,
            COUNT(ca.article_id)::int AS article_count
     FROM collections c
     LEFT JOIN collection_articles ca ON ca.collection_id = c.collection_id
     WHERE c.username = $1
     GROUP BY c.collection_id
     ORDER BY c.updated_at DESC, c.created_at DESC;`,
    [username]
  );
  return rows;
}

async function createCollection(username, input) {
  const collection = validateCollectionInput(input);

  const { rows } = await db.query(
    `INSERT INTO collections (username, name, description)
     VALUES ($1, $2, $3)
     RETURNING collection_id, name, description, created_at, updated_at;`,
    [username, collection.name, collection.description || ""]
  );

  return { ...rows[0], article_count: 0 };
}

async function updateCollection(username, collectionIdInput, input) {
  const collectionId = parsePositiveId(collectionIdInput);
  const updates = validateCollectionInput(input, { partial: true });
  const existing = await ensureOwnedCollection(username, collectionId);

  const name = updates.name ?? existing.name;
  const description = updates.description ?? existing.description;

  const { rows } = await db.query(
    `UPDATE collections
     SET name = $1, description = $2, updated_at = NOW()
     WHERE collection_id = $3 AND username = $4
     RETURNING collection_id, name, description, created_at, updated_at;`,
    [name, description, collectionId, username]
  );

  return rows[0];
}

async function deleteCollection(username, collectionIdInput) {
  const collectionId = parsePositiveId(collectionIdInput);
  const result = await db.query(
    `DELETE FROM collections
     WHERE collection_id = $1 AND username = $2;`,
    [collectionId, username]
  );

  if (!result.rowCount) throw { status: 404, msg: "Not Found" };
}

async function getCollection(username, collectionIdInput) {
  const collection = await ensureOwnedCollection(username, collectionIdInput);

  const { rows } = await db.query(
    `SELECT a.author, a.title, a.article_id, a.topic, a.created_at, a.updated_at,
            a.votes, a.article_img_url, COUNT(c.comment_id)::int AS comment_count,
            ca.added_at
     FROM collection_articles ca
     JOIN articles a ON a.article_id = ca.article_id
     LEFT JOIN comments c
       ON c.article_id = a.article_id AND c.deleted_at IS NULL
     WHERE ca.collection_id = $1
       AND a.status = 'published'
       AND a.deleted_at IS NULL
     GROUP BY a.article_id, ca.added_at
     ORDER BY ca.added_at DESC;`,
    [collection.collection_id]
  );

  return { ...collection, articles: rows };
}

async function addArticleToCollection(username, collectionIdInput, articleIdInput) {
  const collection = await ensureOwnedCollection(username, collectionIdInput);
  const articleId = parsePositiveId(articleIdInput);

  const article = await db.query(
    `SELECT article_id
     FROM articles
     WHERE article_id = $1 AND status = 'published' AND deleted_at IS NULL;`,
    [articleId]
  );

  if (!article.rows.length) throw { status: 404, msg: "Not Found" };

  await db.query(
    `INSERT INTO collection_articles (collection_id, article_id)
     VALUES ($1, $2)
     ON CONFLICT (collection_id, article_id) DO NOTHING;`,
    [collection.collection_id, articleId]
  );

  await db.query(
    "UPDATE collections SET updated_at = NOW() WHERE collection_id = $1;",
    [collection.collection_id]
  );
}

async function removeArticleFromCollection(username, collectionIdInput, articleIdInput) {
  const collection = await ensureOwnedCollection(username, collectionIdInput);
  const articleId = parsePositiveId(articleIdInput);

  await db.query(
    `DELETE FROM collection_articles
     WHERE collection_id = $1 AND article_id = $2;`,
    [collection.collection_id, articleId]
  );

  await db.query(
    "UPDATE collections SET updated_at = NOW() WHERE collection_id = $1;",
    [collection.collection_id]
  );
}

module.exports = {
  addArticleToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeArticleFromCollection,
  updateCollection,
};
