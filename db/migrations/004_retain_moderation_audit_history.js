async function up(client) {
  await client.query(`
    ALTER TABLE moderator_audit_log
    DROP CONSTRAINT IF EXISTS moderator_audit_log_moderator_username_fkey;
  `);

  await client.query(`
    ALTER TABLE moderator_audit_log
    ALTER COLUMN moderator_username DROP NOT NULL;
  `);

  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'moderator_audit_log_moderator_username_fkey'
      ) THEN
        ALTER TABLE moderator_audit_log
        ADD CONSTRAINT moderator_audit_log_moderator_username_fkey
        FOREIGN KEY (moderator_username)
        REFERENCES users(username)
        ON DELETE SET NULL;
      END IF;
    END $$;
  `);
}

module.exports = {
  version: 4,
  name: "retain_moderation_audit_history",
  up,
};
