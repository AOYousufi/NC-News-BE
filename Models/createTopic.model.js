const db = require("../db/connection");
const { badRequest } = require("../utils/validation");

function validateTopic(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw badRequest();
  }

  if (Object.keys(input).some((key) => !["slug", "description"].includes(key))) {
    throw badRequest();
  }

  if (typeof input.slug !== "string" || typeof input.description !== "string") {
    throw badRequest();
  }

  const slug = input.slug.trim().toLowerCase();
  const description = input.description.trim();

  if (!/^[a-z0-9-]{2,40}$/.test(slug)) throw badRequest();
  if (description.length < 3 || description.length > 500) throw badRequest();

  return { slug, description };
}

async function createTopic(input) {
  const topic = validateTopic(input);

  const { rows } = await db.query(
    `INSERT INTO topics (slug, description)
     VALUES ($1, $2)
     RETURNING *;`,
    [topic.slug, topic.description]
  );

  return rows[0];
}

module.exports = createTopic;
