const db = require("../db/connection");

async function AddNewUser(username, name, avatarUrl, passwordHash) {
  const { rows } = await db.query(
    "INSERT INTO users (username, name, avatar_url, password_hash) VALUES ($1, $2, $3, $4) RETURNING username, name, avatar_url;",
    [username, name, avatarUrl, passwordHash]
  );
  return rows[0];
}

module.exports = { AddNewUser };
