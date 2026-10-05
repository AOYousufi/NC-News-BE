const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "test") return "nc-news-test-secret";
  throw new Error("JWT_SECRET is not configured");
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signToken(username) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson({
    sub: username,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  });
  const unsignedToken = header + "." + payload;
  const signature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(unsignedToken)
    .digest("base64url");

  return unsignedToken + "." + signature;
}

function verifyToken(token) {
  const parts = typeof token === "string" ? token.split(".") : [];
  if (parts.length !== 3) throw new Error("Invalid token");

  const [headerPart, payloadPart, signature] = parts;
  const unsignedToken = headerPart + "." + payloadPart;
  const expectedSignature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(unsignedToken)
    .digest("base64url");

  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    throw new Error("Invalid token");
  }

  const header = JSON.parse(Buffer.from(headerPart, "base64url").toString());
  const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString());

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Invalid token");
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || !payload.exp || payload.exp <= now) {
    throw new Error("Invalid or expired token");
  }

  return payload;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64);
  return "scrypt$" + salt.toString("hex") + "$" + derivedKey.toString("hex");
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string") return false;
  const [algorithm, saltHex, hashHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
};
