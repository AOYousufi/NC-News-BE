const db = require("./connection");

const LEGACY_LOCKED_PASSWORD = "legacy-account-locked";
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
     WHERE password_hash IS NULL OR password_hash = $2;`,
    [LEGACY_LOCKED_PASSWORD, LEGACY_DEMO_PASSWORD_HASH]
  );

  await db.query(`
    ALTER TABLE users
    ALTER COLUMN password_hash SET NOT NULL;
  `);

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
  `);

  await db.query(`
    UPDATE users SET role = 'user' WHERE role IS NULL;
  `);

  await db.query(`
    ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'user',
    ALTER COLUMN role SET NOT NULL;
  `);

  await db.query(`
    DO $
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
      ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('user', 'moderator'));
      END IF;
    END $;
  `);

  await db.query(`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
  `);

  await db.query(`
    UPDATE articles SET status = 'published' WHERE status IS NULL;
  `);

  await db.query(`
    ALTER TABLE articles
    ALTER COLUMN status SET DEFAULT 'published',
    ALTER COLUMN status SET NOT NULL;
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'articles_status_check'
      ) THEN
        ALTER TABLE articles
        ADD CONSTRAINT articles_status_check
        CHECK (status IN ('published', 'draft'));
      END IF;
    END $$;
  `);

  await db.query(`
    ALTER TABLE comments
    ADD COLUMN IF NOT EXISTS parent_comment_id INT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'comments_parent_comment_id_fkey'
      ) THEN
        ALTER TABLE comments
        ADD CONSTRAINT comments_parent_comment_id_fkey
        FOREIGN KEY (parent_comment_id)
        REFERENCES comments(comment_id)
        ON DELETE CASCADE;
      END IF;
    END $$;
  `);

  await db.query(`
    DO $
    BEGIN
      IF to_regclass('public.article_revisions') IS NULL THEN
        CREATE TABLE article_revisions (
          revision_id SERIAL PRIMARY KEY,
          article_id INT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
          editor_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
          title VARCHAR NOT NULL,
          topic VARCHAR NOT NULL,
          body VARCHAR NOT NULL,
          article_img_url VARCHAR,
          status VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        UPDATE articles SET updated_at = created_at;
      END IF;
    END $;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS article_votes (
      username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      article_id INT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
      vote_value SMALLINT NOT NULL CHECK (vote_value IN (-1, 1)),
      PRIMARY KEY (username, article_id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS comment_votes (
      username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      comment_id INT NOT NULL REFERENCES comments(comment_id) ON DELETE CASCADE,
      vote_value SMALLINT NOT NULL CHECK (vote_value IN (-1, 1)),
      PRIMARY KEY (username, comment_id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS saved_articles (
      username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      article_id INT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
      saved_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (username, article_id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_follows (
      follower_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      followed_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (follower_username, followed_username),
      CHECK (follower_username <> followed_username)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      report_id SERIAL PRIMARY KEY,
      reporter_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('article', 'comment')),
      article_id INT REFERENCES articles(article_id) ON DELETE CASCADE,
      comment_id INT REFERENCES comments(comment_id) ON DELETE CASCADE,
      reason VARCHAR(40) NOT NULL CHECK (
        reason IN ('spam', 'harassment', 'misinformation', 'off-topic', 'other')
      ),
      details VARCHAR(1000) DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved', 'dismissed')),
      created_at TIMESTAMP DEFAULT NOW(),
      reviewer_username VARCHAR REFERENCES users(username) ON DELETE SET NULL,
      reviewed_at TIMESTAMP,
      CHECK (
        (target_type = 'article' AND article_id IS NOT NULL AND comment_id IS NULL)
        OR
        (target_type = 'comment' AND comment_id IS NOT NULL AND article_id IS NOT NULL)
      )
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id SERIAL PRIMARY KEY,
      recipient_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      actor_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      type VARCHAR(40) NOT NULL CHECK (
        type IN ('follow', 'article_comment', 'reply', 'article_agree', 'article_disagree')
      ),
      article_id INT REFERENCES articles(article_id) ON DELETE CASCADE,
      comment_id INT REFERENCES comments(comment_id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      read_at TIMESTAMP
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_articles_status_created_at
      ON articles(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_author_status
      ON articles(author, status);
    CREATE INDEX IF NOT EXISTS idx_comments_article_parent
      ON comments(article_id, parent_comment_id);
    CREATE INDEX IF NOT EXISTS idx_saved_articles_username_saved_at
      ON saved_articles(username, saved_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_follows_follower
      ON user_follows(follower_username);
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
      ON notifications(recipient_username, read_at, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_status_created_at
      ON reports(status, created_at DESC);
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
