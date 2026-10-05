const db = require("./connection");

const LEGACY_LOCKED_PASSWORD = "legacy-account-locked";

async function migrate() {
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR;
  `);

  await db.query(
    `UPDATE users
     SET password_hash = $1
     WHERE password_hash IS NULL;`,
    [LEGACY_LOCKED_PASSWORD]
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
