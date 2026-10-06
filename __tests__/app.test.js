const db = require("../db/connection.js");
const request = require("supertest");
const app = require("../app.js");
const endpointsJson = require("../endpoints.json");
require("jest-sorted");
const {
  articleData,
  commentData,
  topicData,
  userData,
} = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");
const { signToken } = require("../utils/auth");

const auth = (username) => ({
  Authorization: "Bearer " + signToken(username),
});

beforeEach(() => seed({ topicData, userData, articleData, commentData }));
afterAll(() => db.end());

describe("GET /api", () => {
  test("200: returns endpoint documentation", async () => {
    const { body } = await request(app).get("/api").expect(200);
    expect(body).toEqual(endpointsJson);
  });
});

describe("public read endpoints", () => {
  test("GET /api/topics returns all topics", async () => {
    const { body } = await request(app).get("/api/topics").expect(200);
    expect(body.topics).toHaveLength(topicData.length);
    body.topics.forEach((topic) => {
      expect(topic).toEqual(
        expect.objectContaining({ slug: expect.any(String), description: expect.any(String) })
      );
    });
  });

  test("GET /api/articles returns articles sorted newest first by default", async () => {
    const { body } = await request(app).get("/api/articles").expect(200);
    expect(body.articles.length).toBeGreaterThan(0);
    expect(body.articles).toBeSortedBy("created_at", { descending: true });
    body.articles.forEach((article) => {
      expect(article).toEqual(
        expect.objectContaining({
          author: expect.any(String),
          title: expect.any(String),
          article_id: expect.any(Number),
          topic: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          article_img_url: expect.any(String),
          comment_count: expect.any(Number),
        })
      );
    });
  });

  test("GET /api/articles supports sorting", async () => {
    const { body } = await request(app)
      .get("/api/articles?sort_by=author&order=asc")
      .expect(200);
    expect(body.articles).toBeSortedBy("author", { descending: false });
  });

  test("GET /api/articles supports topic filtering", async () => {
    const { body } = await request(app)
      .get("/api/articles?topic=cats")
      .expect(200);
    expect(body.articles.length).toBeGreaterThan(0);
    body.articles.forEach((article) => expect(article.topic).toBe("cats"));
  });

  test("GET /api/articles supports author filtering", async () => {
    const { body } = await request(app)
      .get("/api/articles?author=rogersop")
      .expect(200);
    expect(body.articles.length).toBeGreaterThan(0);
    body.articles.forEach((article) => expect(article.author).toBe("rogersop"));
  });

  test("GET /api/articles supports optional pagination without changing the default response", async () => {
    const { body } = await request(app).get("/api/articles?limit=2&p=2").expect(200);
    expect(body.articles).toHaveLength(2);
  });

  test("GET /api/articles rejects invalid sort_by", async () => {
    const { body } = await request(app)
      .get("/api/articles?sort_by=body")
      .expect(400);
    expect(body.msg).toBe("Invalid sort_by column");
  });

  test("GET /api/articles rejects invalid order", async () => {
    const { body } = await request(app)
      .get("/api/articles?order=sideways")
      .expect(400);
    expect(body.msg).toBe("Invalid order value");
  });

  test("GET /api/articles rejects invalid pagination", async () => {
    const { body } = await request(app).get("/api/articles?limit=0").expect(400);
    expect(body.msg).toBe("Invalid limit value");
  });

  test("GET /api/articles returns 404 for an unknown topic", async () => {
    const { body } = await request(app)
      .get("/api/articles?topic=not-a-topic")
      .expect(404);
    expect(body.msg).toBe("Not Found");
  });

  test("GET /api/articles/:article_id returns the existing response shape", async () => {
    const { body } = await request(app).get("/api/articles/5").expect(200);
    expect(Array.isArray(body.article)).toBe(true);
    expect(body.article[0]).toEqual(
      expect.objectContaining({ article_id: 5, comment_count: expect.any(Number) })
    );
  });

  test("GET /api/articles/:article_id rejects a malformed id", async () => {
    const { body } = await request(app).get("/api/articles/nope").expect(400);
    expect(body.msg).toBe("Bad Request");
  });

  test("GET /api/articles/:article_id returns 404 for a missing article", async () => {
    const { body } = await request(app).get("/api/articles/9999").expect(404);
    expect(body.msg).toBe("Not Found");
  });

  test("GET /api/articles/:article_id/comments returns comments newest first", async () => {
    const { body } = await request(app).get("/api/articles/3/comments").expect(200);
    expect(body.comments).toHaveLength(2);
    expect(body.comments[0].comment_id).toBe(11);
    expect(body.comments[1].comment_id).toBe(10);
  });

  test("GET /api/articles/:article_id/comments returns [] when the article has no comments", async () => {
    const { body } = await request(app).get("/api/articles/2/comments").expect(200);
    expect(body.comments).toEqual([]);
  });

  test("GET /api/articles/:article_id/comments rejects malformed ids", async () => {
    const { body } = await request(app)
      .get("/api/articles/not-an-id/comments")
      .expect(400);
    expect(body.msg).toBe("Bad Request");
  });

  test("GET /api/articles/:article_id/comments returns 404 for a missing article", async () => {
    const { body } = await request(app)
      .get("/api/articles/9999/comments")
      .expect(404);
    expect(body.msg).toBe("Not Found");
  });

  test("GET /api/users returns public user data only", async () => {
    const { body } = await request(app).get("/api/users").expect(200);
    expect(body.users).toEqual(userData);
    body.users.forEach((user) => {
      expect(user).not.toHaveProperty("password_hash");
    });
  });

  test("GET /api/users/:username returns a public user", async () => {
    const { body } = await request(app).get("/api/users/rogersop").expect(200);
    expect(body).toEqual(userData.find((user) => user.username === "rogersop"));
    expect(body).not.toHaveProperty("password_hash");
  });

  test("GET /api/users/:username returns 404 for an unknown user", async () => {
    const { body } = await request(app).get("/api/users/nobody-here").expect(404);
    expect(body.msg).toBe("User Not Found");
  });
});

describe("authentication and users", () => {
  test("POST /api/users/register creates a user, hashes the password and returns a token", async () => {
    const newUser = {
      username: "sultan2026",
      name: "Sultan Dara",
      avatar_url: "https://example.com/avatar.png",
      password: "strong-password",
    };

    const { body } = await request(app)
      .post("/api/users/register")
      .send(newUser)
      .expect(201);

    expect(body.user).toEqual({
      username: newUser.username,
      name: newUser.name,
      avatar_url: newUser.avatar_url,
    });
    expect(body.token).toEqual(expect.any(String));
    expect(JSON.stringify(body)).not.toContain("password_hash");
  });

  test("POST /api/users/signup remains available as the compatibility registration route", async () => {
    const { body } = await request(app)
      .post("/api/users/signup")
      .send({
        username: "legacy_signup",
        name: "Legacy Signup",
        password: "password123",
      })
      .expect(201);
    expect(body.user.username).toBe("legacy_signup");
    expect(body.token).toEqual(expect.any(String));
  });

  test("registration validates required fields", async () => {
    const { body } = await request(app)
      .post("/api/users/register")
      .send({ username: "ab", name: "A", password: "short" })
      .expect(400);
    expect(body.msg).toBe("Bad Request");
  });

  test("registration rejects duplicate usernames", async () => {
    const { body } = await request(app)
      .post("/api/users/register")
      .send({ username: "rogersop", name: "Duplicate", password: "password123" })
      .expect(409);
    expect(body.msg).toBe("Username already exists");
  });

  test("POST /api/users/login authenticates seeded users", async () => {
    const { body } = await request(app)
      .post("/api/users/login")
      .send({ username: "rogersop", password: "password123" })
      .expect(200);
    expect(body.user.username).toBe("rogersop");
    expect(body.token).toEqual(expect.any(String));
    expect(JSON.stringify(body)).not.toContain("password_hash");
  });

  test("login does not reveal whether username or password was wrong", async () => {
    const wrongPassword = await request(app)
      .post("/api/users/login")
      .send({ username: "rogersop", password: "wrong-password" })
      .expect(401);
    const unknownUser = await request(app)
      .post("/api/users/login")
      .send({ username: "unknown", password: "password123" })
      .expect(401);
    expect(wrongPassword.body.msg).toBe("Invalid username or password");
    expect(unknownUser.body.msg).toBe("Invalid username or password");
  });

  test("GET /api/users/me requires authentication", async () => {
    const { body } = await request(app).get("/api/users/me").expect(401);
    expect(body.msg).toBe("Authentication required");
  });

  test("GET /api/users/me rejects an invalid token", async () => {
    const { body } = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer definitely-not-valid")
      .expect(401);
    expect(body.msg).toBe("Invalid or expired token");
  });

  test("GET /api/users/me returns the authenticated public profile", async () => {
    const { body } = await request(app)
      .get("/api/users/me")
      .set(auth("rogersop"))
      .expect(200);
    expect(body.user).toEqual(userData.find((user) => user.username === "rogersop"));
  });

  test("PATCH /api/users/me updates only the authenticated profile", async () => {
    const { body } = await request(app)
      .patch("/api/users/me")
      .set(auth("rogersop"))
      .send({ name: "Paul Updated" })
      .expect(200);
    expect(body.user).toEqual(
      expect.objectContaining({ username: "rogersop", name: "Paul Updated" })
    );
  });
});

describe("protected write endpoints", () => {
  test("guest users cannot post comments", async () => {
    const { body } = await request(app)
      .post("/api/articles/1/comments")
      .send({ body: "Guest comment" })
      .expect(401);
    expect(body.msg).toBe("Authentication required");
  });

  test("authenticated users can post comments and the token decides authorship", async () => {
    const { body } = await request(app)
      .post("/api/articles/1/comments")
      .set(auth("rogersop"))
      .send({ username: "butter_bridge", body: "Authenticated comment" })
      .expect(201);
    expect(body.Comment).toEqual(
      expect.objectContaining({
        body: "Authenticated comment",
        article_id: 1,
        author: "rogersop",
      })
    );
  });

  test("posting a comment validates the body", async () => {
    const { body } = await request(app)
      .post("/api/articles/1/comments")
      .set(auth("rogersop"))
      .send({ body: "   " })
      .expect(400);
    expect(body.msg).toBe("Bad Request");
  });

  test("posting a comment validates the article id", async () => {
    const malformed = await request(app)
      .post("/api/articles/not-an-id/comments")
      .set(auth("rogersop"))
      .send({ body: "Test" })
      .expect(400);
    const missing = await request(app)
      .post("/api/articles/9999/comments")
      .set(auth("rogersop"))
      .send({ body: "Test" })
      .expect(404);
    expect(malformed.body.msg).toBe("Bad Request");
    expect(missing.body.msg).toBe("Not Found");
  });

  test("guest users cannot vote", async () => {
    const { body } = await request(app)
      .patch("/api/articles/1")
      .send({ inc_votes: 1 })
      .expect(401);
    expect(body.msg).toBe("Authentication required");
  });

  test("authenticated users can vote", async () => {
    const { body } = await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: -10 })
      .expect(200);
    expect(body.article.votes).toBe(90);
  });

  test("voting validates inc_votes", async () => {
    const { body } = await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: "10" })
      .expect(400);
    expect(body.msg).toBe("Bad Request");
  });

  test("voting returns 404 for an unknown article", async () => {
    const { body } = await request(app)
      .patch("/api/articles/9999")
      .set(auth("rogersop"))
      .send({ inc_votes: 1 })
      .expect(404);
    expect(body.msg).toBe("Not Found");
  });

  test("guest users cannot delete comments", async () => {
    const { body } = await request(app).delete("/api/comments/2").expect(401);
    expect(body.msg).toBe("Authentication required");
  });

  test("a user can delete their own comment", async () => {
    await request(app)
      .delete("/api/comments/2")
      .set(auth("butter_bridge"))
      .expect(204);
  });

  test("a user cannot delete somebody else's comment", async () => {
    const { body } = await request(app)
      .delete("/api/comments/2")
      .set(auth("rogersop"))
      .expect(403);
    expect(body.msg).toBe("Forbidden");
  });

  test("deleting validates comment ids", async () => {
    const malformed = await request(app)
      .delete("/api/comments/nope")
      .set(auth("butter_bridge"))
      .expect(400);
    const missing = await request(app)
      .delete("/api/comments/9999")
      .set(auth("butter_bridge"))
      .expect(404);
    expect(malformed.body.msg).toBe("Bad Request");
    expect(missing.body.msg).toBe("Not Found");
  });
});

describe("article ownership CRUD", () => {
  test("guest users cannot create articles", async () => {
    const { body } = await request(app)
      .post("/api/articles")
      .send({ title: "Guest story", topic: "cats", body: "No token" })
      .expect(401);

    expect(body.msg).toBe("Authentication required");
  });

  test("authenticated users can create an article and token identity becomes the author", async () => {
    const { body } = await request(app)
      .post("/api/articles")
      .set(auth("rogersop"))
      .send({
        title: "A proper new story",
        topic: "cats",
        body: "Created through the authenticated CRUD endpoint.",
        article_img_url: "https://example.com/new-story.jpg",
      })
      .expect(201);

    expect(body.article).toEqual(
      expect.objectContaining({
        title: "A proper new story",
        topic: "cats",
        author: "rogersop",
        body: "Created through the authenticated CRUD endpoint.",
        article_img_url: "https://example.com/new-story.jpg",
        votes: 0,
        comment_count: 0,
        article_id: expect.any(Number),
        created_at: expect.any(String),
      })
    );
  });

  test("article creation rejects missing fields, unknown topics and client-controlled ownership fields", async () => {
    const missing = await request(app)
      .post("/api/articles")
      .set(auth("rogersop"))
      .send({ title: "Incomplete" })
      .expect(400);

    const unknownTopic = await request(app)
      .post("/api/articles")
      .set(auth("rogersop"))
      .send({
        title: "Unknown topic",
        topic: "does-not-exist",
        body: "No such topic",
      })
      .expect(404);

    const spoofedAuthor = await request(app)
      .post("/api/articles")
      .set(auth("rogersop"))
      .send({
        title: "Spoof attempt",
        topic: "cats",
        body: "Trying to set the author",
        author: "butter_bridge",
      })
      .expect(400);

    expect(missing.body.msg).toBe("Bad Request");
    expect(unknownTopic.body.msg).toBe("Not Found");
    expect(spoofedAuthor.body.msg).toBe("Bad Request");
  });

  test("an owner can edit article content without changing authorship or votes", async () => {
    const before = await request(app).get("/api/articles/4").expect(200);
    const originalVotes = before.body.article[0].votes;

    const { body } = await request(app)
      .patch("/api/articles/4")
      .set(auth("rogersop"))
      .send({
        title: "Updated by the owner",
        body: "The owner can update article content.",
        topic: "cats",
      })
      .expect(200);

    expect(body.article).toEqual(
      expect.objectContaining({
        article_id: 4,
        title: "Updated by the owner",
        body: "The owner can update article content.",
        topic: "cats",
        author: "rogersop",
        votes: originalVotes,
        comment_count: expect.any(Number),
      })
    );
  });

  test("a user cannot edit somebody else's article", async () => {
    const { body } = await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ title: "Not mine" })
      .expect(403);

    expect(body.msg).toBe("Forbidden");
  });

  test("article editing rejects empty, mixed vote/edit and protected fields", async () => {
    const empty = await request(app)
      .patch("/api/articles/4")
      .set(auth("rogersop"))
      .send({})
      .expect(400);

    const mixed = await request(app)
      .patch("/api/articles/4")
      .set(auth("rogersop"))
      .send({ inc_votes: 1, title: "Mixed operation" })
      .expect(400);

    const protectedField = await request(app)
      .patch("/api/articles/4")
      .set(auth("rogersop"))
      .send({ votes: 999 })
      .expect(400);

    expect(empty.body.msg).toBe("Bad Request");
    expect(mixed.body.msg).toBe("Bad Request");
    expect(protectedField.body.msg).toBe("Bad Request");
  });

  test("article editing validates ids and missing resources", async () => {
    const malformed = await request(app)
      .patch("/api/articles/nope")
      .set(auth("rogersop"))
      .send({ title: "Nope" })
      .expect(400);

    const missing = await request(app)
      .patch("/api/articles/9999")
      .set(auth("rogersop"))
      .send({ title: "Missing" })
      .expect(404);

    expect(malformed.body.msg).toBe("Bad Request");
    expect(missing.body.msg).toBe("Not Found");
  });

  test("guest users cannot delete articles", async () => {
    const { body } = await request(app)
      .delete("/api/articles/4")
      .expect(401);

    expect(body.msg).toBe("Authentication required");
  });

  test("a user cannot delete somebody else's article", async () => {
    const { body } = await request(app)
      .delete("/api/articles/1")
      .set(auth("rogersop"))
      .expect(403);

    expect(body.msg).toBe("Forbidden");
  });

  test("an owner can delete an article and its comments are removed", async () => {
    const created = await request(app)
      .post("/api/articles")
      .set(auth("rogersop"))
      .send({
        title: "Temporary owned article",
        topic: "cats",
        body: "This will be deleted.",
      })
      .expect(201);

    const articleId = created.body.article.article_id;

    await request(app)
      .post("/api/articles/" + articleId + "/comments")
      .set(auth("butter_bridge"))
      .send({ body: "A comment that should be deleted with the article." })
      .expect(201);

    await request(app)
      .delete("/api/articles/" + articleId)
      .set(auth("rogersop"))
      .expect(204);

    await request(app).get("/api/articles/" + articleId).expect(404);

    const { rows } = await db.query(
      "SELECT COUNT(*)::int AS count FROM comments WHERE article_id = $1;",
      [articleId]
    );
    expect(rows[0].count).toBe(0);
  });

  test("article deletion validates ids and missing resources", async () => {
    const malformed = await request(app)
      .delete("/api/articles/not-an-id")
      .set(auth("rogersop"))
      .expect(400);

    const missing = await request(app)
      .delete("/api/articles/9999")
      .set(auth("rogersop"))
      .expect(404);

    expect(malformed.body.msg).toBe("Bad Request");
    expect(missing.body.msg).toBe("Not Found");
  });
});

describe("error handling", () => {
  test("unknown routes return a consistent 404 body", async () => {
    const { body } = await request(app).get("/api/does-not-exist").expect(404);
    expect(body).toEqual({ msg: "Route Not Found" });
  });
});
