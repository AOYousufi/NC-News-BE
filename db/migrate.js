const db = require("./connection");
const currentSchema = require("./migrations/001_current_schema");

const migrations = [currentSchema];

async function ensureMigrationTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function migrate() {
  await ensureMigrationTable();

  const { rows } = await db.query(
    "SELECT version FROM schema_migrations ORDER BY version;"
  );
  const applied = new Set(rows.map((row) => row.version));

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;

    const client = await db.connect();

    try {
      await client.query("BEGIN");
      await migration.up(client);
      await client.query(
        `INSERT INTO schema_migrations (version, name)
         VALUES ($1, $2);`,
        [migration.version, migration.name]
      );
      await client.query("COMMIT");
      console.log(
        `Applied migration ${migration.version}: ${migration.name}`
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
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
