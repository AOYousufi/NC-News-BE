const db = require("../db/connection");

async function deleteAccount(username) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM articles WHERE author = $1;",
      [username]
    );

    await client.query(
      "DELETE FROM comments WHERE author = $1;",
      [username]
    );

    const { rows } = await client.query(
      "DELETE FROM users WHERE username = $1 RETURNING username;",
      [username]
    );

    if (!rows.length) {
      throw { status: 404, msg: "User Not Found" };
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = deleteAccount;
