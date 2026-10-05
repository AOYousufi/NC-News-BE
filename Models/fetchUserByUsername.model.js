const db = require("../db/connection");

async function fetchUser(username) {
  const { rows } = await db.query(
    "SELECT username, name, avatar_url FROM users WHERE username = $1;",
    [username]
  );
  return rows[0];
}

module.exports = fetchUser;
