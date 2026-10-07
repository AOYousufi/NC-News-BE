const db = require("../db/connection");

async function findUserForAuthentication(username) {
  const { rows } = await db.query(
    "SELECT username, name, avatar_url, password_hash FROM users WHERE username = $1;",
    [username]
  );
  return rows[0];
}

async function updateUserProfile(username, updates) {
  const { name, avatar_url } = updates;
  const { rows } = await db.query(
    "UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url) WHERE username = $3 RETURNING username, name, avatar_url;",
    [name === undefined ? null : name, avatar_url === undefined ? null : avatar_url, username]
  );
  return rows[0];
}

async function updatePasswordHash(username, passwordHash) {
  const { rows } = await db.query(
    `UPDATE users
     SET password_hash = $1
     WHERE username = $2
     RETURNING username;`,
    [passwordHash, username]
  );
  return rows[0];
}

module.exports = {
  findUserForAuthentication,
  updatePasswordHash,
  updateUserProfile,
};
