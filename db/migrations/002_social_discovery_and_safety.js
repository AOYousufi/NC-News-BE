async function up(client) {
  await client.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bio VARCHAR(500),
    ADD COLUMN IF NOT EXISTS pinned_article_id INT;
  `);

  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_pinned_article_id_fkey'
      ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_pinned_article_id_fkey
        FOREIGN KEY (pinned_article_id)
        REFERENCES articles(article_id)
        ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await client.query(`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
  `);

  await client.query(`
    ALTER TABLE comments
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS topic_follows (
      username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      topic_slug VARCHAR NOT NULL REFERENCES topics(slug) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (username, topic_slug)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS collections (
      collection_id SERIAL PRIMARY KEY,
      username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      name VARCHAR(80) NOT NULL,
      description VARCHAR(300) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (username, name)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS collection_articles (
      collection_id INT NOT NULL REFERENCES collections(collection_id) ON DELETE CASCADE,
      article_id INT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
      added_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (collection_id, article_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS moderator_audit_log (
      audit_id SERIAL PRIMARY KEY,
      moderator_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      action VARCHAR(60) NOT NULL,
      target_type VARCHAR(30) NOT NULL,
      target_id INT,
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_topic_follows_username
      ON topic_follows(username);
    CREATE INDEX IF NOT EXISTS idx_collection_articles_collection
      ON collection_articles(collection_id, added_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_not_deleted
      ON articles(deleted_at) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_comments_not_deleted
      ON comments(deleted_at) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_moderator_audit_created
      ON moderator_audit_log(created_at DESC);
  `);
}

module.exports = {
  version: 2,
  name: "social_discovery_and_safety",
  up,
};
