async function up(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS article_reactions (
      username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      article_id INT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
      reaction VARCHAR(20) NOT NULL
        CHECK (reaction IN ('insightful', 'useful', 'funny')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (username, article_id)
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_article_reactions_article
      ON article_reactions(article_id, reaction);
  `);
}

module.exports = {
  version: 3,
  name: "article_reactions",
  up,
};
