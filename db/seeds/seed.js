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
    .query("DROP TABLE IF EXISTS comments;")
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
        "CREATE TABLE articles (article_id SERIAL PRIMARY KEY, title VARCHAR NOT NULL, topic VARCHAR NOT NULL REFERENCES topics(slug), author VARCHAR NOT NULL REFERENCES users(username), body VARCHAR NOT NULL, created_at TIMESTAMP DEFAULT NOW(), votes INT DEFAULT 0 NOT NULL, article_img_url VARCHAR DEFAULT 'https://images.pexels.com/photos/97050/pexels-photo-97050.jpeg?w=700&h=700');"
      )
    )
    .then(() =>
      db.query(
        "CREATE TABLE comments (comment_id SERIAL PRIMARY KEY, body VARCHAR NOT NULL, article_id INT REFERENCES articles(article_id) NOT NULL, author VARCHAR REFERENCES users(username) NOT NULL, votes INT DEFAULT 0 NOT NULL, created_at TIMESTAMP DEFAULT NOW());"
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
