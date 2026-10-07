const format = require("pg-format");
const db = require("../connection");
const {
  convertTimestampToDate,
  createRef,
  formatComments,
} = require("./utils");

const SEEDED_PASSWORD_HASH =
  "scrypt$0123456789abcdef0123456789abcdef$d088ff89d52c0da7840b769c9055596af699cfdd025910d984548f1c2aaec912263f7f9b924ed19c9e43feff83d9fa02bea94b1b90b66671f3083fd85d65de4f";

const seed = ({ topicData, userData, articleData, commentData }) => {
  return db
    .query("DROP TABLE IF EXISTS notifications;")
    .then(() => db.query("DROP TABLE IF EXISTS saved_articles;"))
    .then(() => db.query("DROP TABLE IF EXISTS user_follows;"))
    .then(() => db.query("DROP TABLE IF EXISTS comment_votes;"))
    .then(() => db.query("DROP TABLE IF EXISTS article_votes;"))
    .then(() => db.query("DROP TABLE IF EXISTS comments;"))
    .then(() => db.query("DROP TABLE IF EXISTS articles;"))
    .then(() => db.query("DROP TABLE IF EXISTS users;"))
    .then(() => db.query("DROP TABLE IF EXISTS topics;"))
    .then(() => {
      const topicsTablePromise = db.query(
        "CREATE TABLE topics (slug VARCHAR PRIMARY KEY, description VARCHAR);"
      );
      const usersTablePromise = db.query(
        "CREATE TABLE users (username VARCHAR PRIMARY KEY, name VARCHAR NOT NULL, avatar_url VARCHAR, password_hash VARCHAR NOT NULL);"
      );
      return Promise.all([topicsTablePromise, usersTablePromise]);
    })
    .then(() =>
      db.query(
        "CREATE TABLE articles (article_id SERIAL PRIMARY KEY, title VARCHAR NOT NULL, topic VARCHAR NOT NULL REFERENCES topics(slug), author VARCHAR NOT NULL REFERENCES users(username), body VARCHAR NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), votes INT DEFAULT 0 NOT NULL, article_img_url VARCHAR DEFAULT 'https://images.pexels.com/photos/97050/pexels-photo-97050.jpeg?w=700&h=700', status VARCHAR(20) DEFAULT 'published' NOT NULL CHECK (status IN ('published', 'draft')));"
      )
    )
    .then(() =>
      db.query(
        "CREATE TABLE comments (comment_id SERIAL PRIMARY KEY, body VARCHAR NOT NULL, article_id INT REFERENCES articles(article_id) ON DELETE CASCADE NOT NULL, author VARCHAR REFERENCES users(username) NOT NULL, votes INT DEFAULT 0 NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), parent_comment_id INT REFERENCES comments(comment_id) ON DELETE CASCADE);"
      )
    )
    .then(() =>
      db.query(
        "CREATE TABLE article_votes (username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE, article_id INT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE, vote_value SMALLINT NOT NULL CHECK (vote_value IN (-1, 1)), PRIMARY KEY (username, article_id));"
      )
    )
    .then(() =>
      db.query(
        "CREATE TABLE comment_votes (username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE, comment_id INT NOT NULL REFERENCES comments(comment_id) ON DELETE CASCADE, vote_value SMALLINT NOT NULL CHECK (vote_value IN (-1, 1)), PRIMARY KEY (username, comment_id));"
      )
    )
    .then(() =>
      db.query(
        "CREATE TABLE saved_articles (username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE, article_id INT NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE, saved_at TIMESTAMP DEFAULT NOW(), PRIMARY KEY (username, article_id));"
      )
    )
    .then(() =>
      db.query(
        "CREATE TABLE user_follows (follower_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE, followed_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT NOW(), PRIMARY KEY (follower_username, followed_username), CHECK (follower_username <> followed_username));"
      )
    )
    .then(() =>
      db.query(
        "CREATE TABLE notifications (notification_id SERIAL PRIMARY KEY, recipient_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE, actor_username VARCHAR NOT NULL REFERENCES users(username) ON DELETE CASCADE, type VARCHAR(40) NOT NULL CHECK (type IN ('follow', 'article_comment', 'reply', 'article_agree', 'article_disagree')), article_id INT REFERENCES articles(article_id) ON DELETE CASCADE, comment_id INT REFERENCES comments(comment_id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT NOW(), read_at TIMESTAMP);"
      )
    )
    .then(() => {
      const insertTopicsQuery = format(
        "INSERT INTO topics (slug, description) VALUES %L;",
        topicData.map(({ slug, description }) => [slug, description])
      );
      const insertUsersQuery = format(
        "INSERT INTO users (username, name, avatar_url, password_hash) VALUES %L;",
        userData.map(({ username, name, avatar_url }) => [
          username,
          name,
          avatar_url,
          SEEDED_PASSWORD_HASH,
        ])
      );
      return Promise.all([db.query(insertTopicsQuery), db.query(insertUsersQuery)]);
    })
    .then(() => {
      const formattedArticleData = articleData.map(convertTimestampToDate);
      const query = format(
        "INSERT INTO articles (title, topic, author, body, created_at, votes, article_img_url) VALUES %L RETURNING *;",
        formattedArticleData.map(
          ({ title, topic, author, body, created_at, votes = 0, article_img_url }) => [
            title,
            topic,
            author,
            body,
            created_at,
            votes,
            article_img_url,
          ]
        )
      );
      return db.query(query);
    })
    .then(({ rows: articleRows }) => {
      const articleIdLookup = createRef(articleRows, "title", "article_id");
      const formattedCommentData = formatComments(commentData, articleIdLookup);
      const query = format(
        "INSERT INTO comments (body, author, article_id, votes, created_at) VALUES %L;",
        formattedCommentData.map(
          ({ body, author, article_id, votes = 0, created_at }) => [
            body,
            author,
            article_id,
            votes,
            created_at,
          ]
        )
      );
      return db.query(query);
    });
};

module.exports = seed;
