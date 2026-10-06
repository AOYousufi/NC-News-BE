const { badRequest } = require("./validation");

const FIELD_LIMITS = {
  title: 300,
  topic: 100,
  body: 50000,
  article_img_url: 2048,
};

const ALLOWED_FIELDS = new Set([...Object.keys(FIELD_LIMITS), "status"]);

function cleanText(value, field, { allowEmpty = false } = {}) {
  if (typeof value !== "string") throw badRequest();

  const cleaned = value.trim();

  if (!allowEmpty && cleaned.length === 0) throw badRequest();
  if (cleaned.length > FIELD_LIMITS[field]) throw badRequest();

  return cleaned;
}

function validateArticleFields(input, { partial = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw badRequest();
  }

  const keys = Object.keys(input);

  if (partial && keys.length === 0) throw badRequest();
  if (keys.some((key) => !ALLOWED_FIELDS.has(key))) throw badRequest();

  if (!partial) {
    for (const required of ["title", "topic", "body"]) {
      if (!(required in input)) throw badRequest();
    }
  }

  const result = {};

  if ("title" in input) result.title = cleanText(input.title, "title");
  if ("topic" in input) result.topic = cleanText(input.topic, "topic");
  if ("body" in input) result.body = cleanText(input.body, "body");

  if ("article_img_url" in input) {
    if (input.article_img_url === null || input.article_img_url === "") {
      result.article_img_url = null;
    } else {
      result.article_img_url = cleanText(input.article_img_url, "article_img_url");
    }
  }

  if ("status" in input) {
    if (!["published", "draft"].includes(input.status)) throw badRequest();
    result.status = input.status;
  }

  return result;
}

module.exports = { validateArticleFields };
