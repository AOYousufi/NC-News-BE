const db = require("./connection");

const LEGACY_DEMO_PASSWORD_HASH =
  "scrypt$0123456789abcdef0123456789abcdef$d088ff89d52c0da7840b769c9055596af699cfdd025910d984548f1c2aaec912263f7f9b924ed19c9e43feff83d9fa02bea94b1b90b66671f3083fd85d65de4f";

async function migrate() {
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR;
  `);

  await db.query(
    `UPDATE users
     SET password_hash = $1
     WHERE password_hash IS NULL;`,
    [LEGACY_DEMO_PASSWORD_HASH]
  );

  await db.query(`
    ALTER TABLE users
    ALTER COLUMN password_hash SET NOT NULL;
  `);
}

if (require.main === module) {
  migrate()
    .then(() => db.end())
    .catch(async (error) => {
      console.error("Database migration failed", error);
      await db.end();
      process.exit(1);
    });
}

module.exports = migrate;
