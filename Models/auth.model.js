const db = require("../db/connection");

async function findUserForAuthentication(username) {
  const { rows } = await db.query(
    "SELECT username, name, avatar_url, bio, pinned_article_id, password_hash, role FROM users WHERE username = $1;",
    [username]
  );
  return rows[0];
}

async function updateUserProfile(username, updates) {
  const allowed = ["name", "avatar_url", "bio", "pinned_article_id"];
  const entries = Object.entries(updates).filter(
    ([key, value]) => allowed.includes(key) && value !== undefined
  );

  if (updates.pinned_article_id !== undefined && updates.pinned_article_id !== null) {
    const article = await db.query(
      `SELECT article_id
       FROM articles
       WHERE article_id = $1
         AND author = $2
         AND status = 'published'
         AND deleted_at IS NULL;`,
      [updates.pinned_article_id, username]
    );

    if (!article.rows.length) {
      throw {
        status: 400,
        msg: "Pinned article must be your own published article",
      };
    }
  }

  if (!entries.length) return null;

  const values = entries.map(([, value]) => value);
  const assignments = entries.map(
    ([key], index) => key + " = $" + (index + 1)
  );
  values.push(username);

  const { rows } = await db.query(
    `UPDATE users
     SET ${assignments.join(", ")}
     WHERE username = $${values.length}
     RETURNING username, name, avatar_url, bio, pinned_article_id, role;`,
    values
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
