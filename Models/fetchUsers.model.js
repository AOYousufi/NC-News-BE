const db = require("../db/connection");

async function fetchAllUsers() {
  const { rows } = await db.query(
    "SELECT username, name, avatar_url FROM users;"
  );
  return rows;
}

module.exports = fetchAllUsers;
