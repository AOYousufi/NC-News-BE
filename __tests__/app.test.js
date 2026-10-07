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

  test("GET /api/articles supports text search across title, body and author", async () => {
    const byTitle = await request(app)
      .get("/api/articles?search=mitch")
      .expect(200);
    expect(byTitle.body.articles.length).toBeGreaterThan(0);
    expect(
      byTitle.body.articles.some((article) =>
        article.title.toLowerCase().includes("mitch")
      )
    ).toBe(true);

    const byAuthor = await request(app)
      .get("/api/articles?search=rogersop")
      .expect(200);
    expect(byAuthor.body.articles.length).toBeGreaterThan(0);
    byAuthor.body.articles.forEach((article) =>
      expect(
        article.author.toLowerCase().includes("rogersop") ||
          article.title.toLowerCase().includes("rogersop")
      ).toBe(true)
    );
  });

  test("GET /api/articles search composes with topic filtering", async () => {
    const { body } = await request(app)
      .get("/api/articles?topic=cats&search=cat")
      .expect(200);
    body.articles.forEach((article) => expect(article.topic).toBe("cats"));
  });

  test("GET /api/articles validates search input", async () => {
    const { body } = await request(app)
      .get("/api/articles?search=a")
      .expect(400);
    expect(body.msg).toBe("Invalid search value");
  });

  test("GET /api/articles supports optional pagination without changing the default response", async () => {
    const { body } = await request(app).get("/api/articles?limit=2&p=2").expect(200);
    expect(body.articles).toHaveLength(2);
  });

  test("GET /api/articles returns pagination metadata", async () => {
    const { body } = await request(app)
      .get("/api/articles?limit=2&p=2")
      .expect(200);

    expect(body.pagination).toEqual(
      expect.objectContaining({
        total_count: expect.any(Number),
        page: 2,
        limit: 2,
        total_pages: expect.any(Number),
        has_previous: true,
        has_next: expect.any(Boolean),
      })
    );
    expect(body.articles).toHaveLength(2);
  });

  test("GET /api/articles includes non-paginated metadata without truncating defaults", async () => {
    const { body } = await request(app).get("/api/articles").expect(200);

    expect(body.pagination.limit).toBeNull();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.total_count).toBe(body.articles.length);
    expect(body.pagination.has_next).toBe(false);
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

  test("authenticated users can agree, switch to disagree and toggle back to neutral", async () => {
    const agreed = await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: 1 })
      .expect(200);

    expect(agreed.body.article.votes).toBe(101);
    expect(agreed.body.article.user_vote).toBe(1);

    const disagreed = await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: -1 })
      .expect(200);

    expect(disagreed.body.article.votes).toBe(99);
    expect(disagreed.body.article.user_vote).toBe(-1);

    const neutral = await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: -1 })
      .expect(200);

    expect(neutral.body.article.votes).toBe(100);
    expect(neutral.body.article.user_vote).toBe(0);
  });

  test("voting state is persisted per authenticated user", async () => {
    await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: 1 })
      .expect(200);

    const { body } = await request(app)
      .get("/api/articles/1/vote")
      .set(auth("rogersop"))
      .expect(200);

    expect(body).toEqual({ vote: 1, can_vote: true });
  });

  test("users cannot vote on their own articles", async () => {
    const { body } = await request(app)
      .patch("/api/articles/4")
      .set(auth("rogersop"))
      .send({ inc_votes: 1 })
      .expect(403);

    expect(body.msg).toBe("You cannot vote on your own article");
  });

  test("voting validates inc_votes", async () => {
    const stringVote = await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: "1" })
      .expect(400);

    const oversizedVote = await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: 10 })
      .expect(400);

    expect(stringVote.body.msg).toBe("Bad Request");
    expect(oversizedVote.body.msg).toBe("Bad Request");
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

describe("topic creation", () => {
  test("guest users cannot create topics", async () => {
    const { body } = await request(app)
      .post("/api/topics")
      .send({ slug: "technology", description: "Technology stories" })
      .expect(401);

    expect(body.msg).toBe("Authentication required");
  });

  test("authenticated users can create a topic", async () => {
    const { body } = await request(app)
      .post("/api/topics")
      .set(auth("rogersop"))
      .send({ slug: "Technology", description: "Technology stories and discussion" })
      .expect(201);

    expect(body.topic).toEqual({
      slug: "technology",
      description: "Technology stories and discussion",
    });

    const topics = await request(app).get("/api/topics").expect(200);
    expect(topics.body.topics).toContainEqual(body.topic);
  });

  test("topic creation validates slug and description", async () => {
    const { body } = await request(app)
      .post("/api/topics")
      .set(auth("rogersop"))
      .send({ slug: "bad topic!", description: "x" })
      .expect(400);

    expect(body.msg).toBe("Bad Request");
  });

  test("duplicate topics return conflict", async () => {
    const { body } = await request(app)
      .post("/api/topics")
      .set(auth("rogersop"))
      .send({ slug: "cats", description: "Another cats topic" })
      .expect(409);

    expect(body.msg).toBe("Resource already exists");
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

describe("saved articles, follows, drafts, activity and replies", () => {
  test("authenticated users can save and unsave a published article idempotently", async () => {
    await request(app)
      .post("/api/articles/1/save")
      .set(auth("rogersop"))
      .expect(204);

    await request(app)
      .post("/api/articles/1/save")
      .set(auth("rogersop"))
      .expect(204);

    const saved = await request(app)
      .get("/api/users/me/saved")
      .set(auth("rogersop"))
      .expect(200);

    expect(saved.body.articles).toHaveLength(1);
    expect(saved.body.articles[0].article_id).toBe(1);

    await request(app)
      .delete("/api/articles/1/save")
      .set(auth("rogersop"))
      .expect(204);

    const after = await request(app)
      .get("/api/users/me/saved")
      .set(auth("rogersop"))
      .expect(200);

    expect(after.body.articles).toHaveLength(0);
  });

  test("users can follow and unfollow another user and the feed only contains followed authors", async () => {
    await request(app)
      .post("/api/users/butter_bridge/follow")
      .set(auth("rogersop"))
      .expect(204);

    const following = await request(app)
      .get("/api/users/me/following")
      .set(auth("rogersop"))
      .expect(200);

    expect(following.body.users.map((user) => user.username)).toContain("butter_bridge");

    const status = await request(app)
      .get("/api/users/butter_bridge/follow-status")
      .set(auth("rogersop"))
      .expect(200);

    expect(status.body).toEqual({ following: true, is_self: false });

    const feed = await request(app)
      .get("/api/articles/feed")
      .set(auth("rogersop"))
      .expect(200);

    expect(feed.body.articles.length).toBeGreaterThan(0);
    feed.body.articles.forEach((article) =>
      expect(article.author).toBe("butter_bridge")
    );

    await request(app)
      .delete("/api/users/butter_bridge/follow")
      .set(auth("rogersop"))
      .expect(204);
  });

  test("users cannot follow themselves", async () => {
    const { body } = await request(app)
      .post("/api/users/rogersop/follow")
      .set(auth("rogersop"))
      .expect(400);

    expect(body.msg).toBe("You cannot follow yourself");
  });

  test("draft articles are private until published", async () => {
    const created = await request(app)
      .post("/api/articles")
      .set(auth("rogersop"))
      .send({
        title: "Private draft",
        topic: "cats",
        body: "Not ready yet",
        status: "draft",
      })
      .expect(201);

    const articleId = created.body.article.article_id;
    expect(created.body.article.status).toBe("draft");

    await request(app).get("/api/articles/" + articleId).expect(404);

    const publicFeed = await request(app).get("/api/articles").expect(200);
    expect(publicFeed.body.articles.some((article) => article.article_id === articleId)).toBe(false);

    const drafts = await request(app)
      .get("/api/articles/drafts")
      .set(auth("rogersop"))
      .expect(200);

    expect(drafts.body.articles.map((article) => article.article_id)).toContain(articleId);

    const managed = await request(app)
      .get("/api/articles/" + articleId + "/manage")
      .set(auth("rogersop"))
      .expect(200);

    expect(managed.body.article.status).toBe("draft");

    await request(app)
      .get("/api/articles/" + articleId + "/manage")
      .set(auth("butter_bridge"))
      .expect(404);

    await request(app)
      .patch("/api/articles/" + articleId)
      .set(auth("rogersop"))
      .send({ status: "published" })
      .expect(200);

    await request(app).get("/api/articles/" + articleId).expect(200);
  });

  test("comments can reply to comments on the same article", async () => {
    const parent = await request(app)
      .post("/api/articles/1/comments")
      .set(auth("rogersop"))
      .send({ body: "Parent comment" })
      .expect(201);

    const reply = await request(app)
      .post("/api/articles/1/comments")
      .set(auth("butter_bridge"))
      .send({
        body: "Nested reply",
        parent_comment_id: parent.body.Comment.comment_id,
      })
      .expect(201);

    expect(reply.body.Comment.parent_comment_id).toBe(parent.body.Comment.comment_id);

    const comments = await request(app)
      .get("/api/articles/1/comments")
      .expect(200);

    expect(
      comments.body.comments.find(
        (comment) => comment.comment_id === reply.body.Comment.comment_id
      )
    ).toEqual(expect.objectContaining({ parent_comment_id: parent.body.Comment.comment_id }));
  });

  test("reply parent must exist on the same article", async () => {
    const otherArticleComment = await request(app)
      .post("/api/articles/1/comments")
      .set(auth("rogersop"))
      .send({ body: "Lives elsewhere" })
      .expect(201);

    const { body } = await request(app)
      .post("/api/articles/3/comments")
      .set(auth("butter_bridge"))
      .send({
        body: "Wrong article reply",
        parent_comment_id: otherArticleComment.body.Comment.comment_id,
      })
      .expect(400);

    expect(body.msg).toBe("Reply must belong to the same article");
  });

  test("activity dashboard returns counts and recent activity", async () => {
    await request(app)
      .post("/api/articles/1/save")
      .set(auth("rogersop"))
      .expect(204);

    await request(app)
      .post("/api/users/butter_bridge/follow")
      .set(auth("rogersop"))
      .expect(204);

    await request(app)
      .post("/api/articles/1/comments")
      .set(auth("rogersop"))
      .send({ body: "Activity comment" })
      .expect(201);

    const { body } = await request(app)
      .get("/api/users/me/activity")
      .set(auth("rogersop"))
      .expect(200);

    expect(body.stats).toEqual(
      expect.objectContaining({
        published_articles: expect.any(Number),
        drafts: expect.any(Number),
        comments: expect.any(Number),
        saved_articles: 1,
        following: 1,
      })
    );

    expect(body.activity.length).toBeGreaterThan(0);
    expect(body.activity.map((item) => item.type)).toEqual(
      expect.arrayContaining(["saved", "follow", "comment"])
    );
  });

  test("guests cannot use private dashboard/social endpoints", async () => {
    await request(app).get("/api/users/me/activity").expect(401);
    await request(app).get("/api/users/me/saved").expect(401);
    await request(app).get("/api/articles/drafts").expect(401);
    await request(app).get("/api/articles/feed").expect(401);
  });
});

describe("public profile stats", () => {
  test("GET /api/users/:username/stats returns public contribution stats", async () => {
    const { body } = await request(app)
      .get("/api/users/rogersop/stats")
      .expect(200);

    expect(body.stats).toEqual(
      expect.objectContaining({
        articles: expect.any(Number),
        comments: expect.any(Number),
        followers: expect.any(Number),
        following: expect.any(Number),
        article_votes_received: expect.any(Number),
        comment_votes_received: expect.any(Number),
      })
    );
  });

  test("profile stats return 404 for an unknown user", async () => {
    const { body } = await request(app)
      .get("/api/users/not-a-real-user/stats")
      .expect(404);

    expect(body.msg).toBe("User Not Found");
  });
});

describe("reporting and moderation", () => {
  test("authenticated users can report another user's article", async () => {
    const { body } = await request(app)
      .post("/api/reports")
      .set(auth("rogersop"))
      .send({
        target_type: "article",
        target_id: 1,
        reason: "spam",
        details: "Repeated promotional content",
      })
      .expect(201);

    expect(body.report).toEqual(
      expect.objectContaining({
        reporter_username: "rogersop",
        target_type: "article",
        article_id: 1,
        reason: "spam",
        status: "open",
      })
    );
  });

  test("users can report comments and cannot report their own content", async () => {
    await request(app)
      .post("/api/reports")
      .set(auth("rogersop"))
      .send({
        target_type: "comment",
        target_id: 2,
        reason: "harassment",
      })
      .expect(201);

    const own = await request(app)
      .post("/api/reports")
      .set(auth("rogersop"))
      .send({
        target_type: "article",
        target_id: 4,
        reason: "other",
      })
      .expect(400);

    expect(own.body.msg).toBe("You cannot report your own content");
  });

  test("normal users cannot access the moderation queue", async () => {
    const { body } = await request(app)
      .get("/api/moderation/reports")
      .set(auth("butter_bridge"))
      .expect(403);

    expect(body.msg).toBe("Moderator access required");
  });

  test("moderators can list and resolve reports", async () => {
    const created = await request(app)
      .post("/api/reports")
      .set(auth("butter_bridge"))
      .send({
        target_type: "article",
        target_id: 4,
        reason: "off-topic",
      })
      .expect(201);

    const list = await request(app)
      .get("/api/moderation/reports")
      .set(auth("rogersop"))
      .expect(200);

    expect(
      list.body.reports.some(
        (report) => report.report_id === created.body.report.report_id
      )
    ).toBe(true);

    const reviewed = await request(app)
      .patch("/api/moderation/reports/" + created.body.report.report_id)
      .set(auth("rogersop"))
      .send({ status: "resolved" })
      .expect(200);

    expect(reviewed.body.report).toEqual(
      expect.objectContaining({
        status: "resolved",
        reviewer_username: "rogersop",
        reviewed_at: expect.any(String),
      })
    );
  });

  test("reporting validates target type, reason and target existence", async () => {
    await request(app)
      .post("/api/reports")
      .set(auth("rogersop"))
      .send({
        target_type: "article",
        target_id: 9999,
        reason: "spam",
      })
      .expect(404);

    await request(app)
      .post("/api/reports")
      .set(auth("rogersop"))
      .send({
        target_type: "article",
        target_id: 1,
        reason: "not-valid",
      })
      .expect(400);
  });
});

describe("account deletion", () => {
  test("authenticated users can delete their account with password and username confirmation", async () => {
    await request(app)
      .delete("/api/users/me")
      .set(auth("rogersop"))
      .send({
        password: "password123",
        confirmation: "rogersop",
      })
      .expect(204);

    await request(app).get("/api/users/rogersop").expect(404);

    const articles = await request(app)
      .get("/api/articles?author=rogersop")
      .expect(404);

    expect(articles.body.msg).toBe("Not Found");
  });

  test("account deletion rejects an incorrect password", async () => {
    const { body } = await request(app)
      .delete("/api/users/me")
      .set(auth("rogersop"))
      .send({
        password: "wrong-password",
        confirmation: "rogersop",
      })
      .expect(401);

    expect(body.msg).toBe("Current password is incorrect");
  });

  test("account deletion requires an exact username confirmation", async () => {
    const { body } = await request(app)
      .delete("/api/users/me")
      .set(auth("rogersop"))
      .send({
        password: "password123",
        confirmation: "DELETE",
      })
      .expect(400);

    expect(body.msg).toBe("Bad Request");
  });
});

describe("password changes", () => {
  test("authenticated users can change their password with the current password", async () => {
    await request(app)
      .patch("/api/users/me/password")
      .set(auth("rogersop"))
      .send({
        current_password: "password123",
        new_password: "a-new-password-123",
      })
      .expect(204);

    await request(app)
      .post("/api/users/login")
      .send({ username: "rogersop", password: "password123" })
      .expect(401);

    await request(app)
      .post("/api/users/login")
      .send({ username: "rogersop", password: "a-new-password-123" })
      .expect(200);
  });

  test("password changes reject an incorrect current password", async () => {
    const { body } = await request(app)
      .patch("/api/users/me/password")
      .set(auth("rogersop"))
      .send({
        current_password: "wrong-password",
        new_password: "a-new-password-123",
      })
      .expect(401);

    expect(body.msg).toBe("Current password is incorrect");
  });

  test("password changes validate the new password", async () => {
    await request(app)
      .patch("/api/users/me/password")
      .set(auth("rogersop"))
      .send({
        current_password: "password123",
        new_password: "short",
      })
      .expect(400);

    const same = await request(app)
      .patch("/api/users/me/password")
      .set(auth("rogersop"))
      .send({
        current_password: "password123",
        new_password: "password123",
      })
      .expect(400);

    expect(same.body.msg).toBe("New password must be different");
  });
});

describe("article revision history", () => {
  test("editing an owned article stores the previous version", async () => {
    const before = await request(app).get("/api/articles/4").expect(200);
    const original = before.body.article[0];

    await request(app)
      .patch("/api/articles/4")
      .set(auth("rogersop"))
      .send({ title: "Revision history title" })
      .expect(200);

    const { body } = await request(app)
      .get("/api/articles/4/revisions")
      .set(auth("rogersop"))
      .expect(200);

    expect(body.revisions).toHaveLength(1);
    expect(body.revisions[0]).toEqual(
      expect.objectContaining({
        article_id: 4,
        editor_username: "rogersop",
        title: original.title,
        topic: original.topic,
        body: original.body,
      })
    );
  });

  test("article revision history is owner-only", async () => {
    await request(app)
      .get("/api/articles/1/revisions")
      .set(auth("rogersop"))
      .expect(403);
  });

  test("article updated_at changes when edited", async () => {
    const before = await request(app).get("/api/articles/4").expect(200);

    const after = await request(app)
      .patch("/api/articles/4")
      .set(auth("rogersop"))
      .send({ body: "Edited article body for timestamp test" })
      .expect(200);

    expect(new Date(after.body.article.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before.body.article[0].updated_at).getTime()
    );
  });
});

describe("comment editing", () => {
  test("comment owners can edit their own comment", async () => {
    const before = await request(app)
      .get("/api/articles/1/comments")
      .expect(200);
    const target = before.body.comments.find((comment) => comment.comment_id === 2);

    const { body } = await request(app)
      .patch("/api/comments/2")
      .set(auth("butter_bridge"))
      .send({ body: "Edited comment body" })
      .expect(200);

    expect(body.comment).toEqual(
      expect.objectContaining({
        comment_id: 2,
        body: "Edited comment body",
        author: "butter_bridge",
        updated_at: expect.any(String),
      })
    );
    expect(new Date(body.comment.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(target.created_at).getTime()
    );
  });

  test("users cannot edit somebody else's comment", async () => {
    const { body } = await request(app)
      .patch("/api/comments/2")
      .set(auth("rogersop"))
      .send({ body: "Not mine" })
      .expect(403);

    expect(body.msg).toBe("Forbidden");
  });

  test("comment editing validates body and payload shape", async () => {
    await request(app)
      .patch("/api/comments/2")
      .set(auth("butter_bridge"))
      .send({ body: "   " })
      .expect(400);

    await request(app)
      .patch("/api/comments/2")
      .set(auth("butter_bridge"))
      .send({ body: "Valid", author: "rogersop" })
      .expect(400);
  });
});

describe("public profile comments", () => {
  test("GET /api/users/:username/comments returns public comments with article context", async () => {
    const { body } = await request(app)
      .get("/api/users/butter_bridge/comments")
      .expect(200);

    expect(Array.isArray(body.comments)).toBe(true);
    body.comments.forEach((comment) => {
      expect(comment).toEqual(
        expect.objectContaining({
          comment_id: expect.any(Number),
          body: expect.any(String),
          article_id: expect.any(Number),
          article_title: expect.any(String),
          votes: expect.any(Number),
        })
      );
    });
  });

  test("public comments return 404 for an unknown user", async () => {
    const { body } = await request(app)
      .get("/api/users/not-a-real-user/comments")
      .expect(404);

    expect(body.msg).toBe("User Not Found");
  });
});

describe("comment voting", () => {
  test("users can agree, switch and clear a comment vote", async () => {
    const agreed = await request(app)
      .patch("/api/comments/2/vote")
      .set(auth("rogersop"))
      .send({ inc_votes: 1 })
      .expect(200);

    expect(agreed.body.comment.user_vote).toBe(1);

    const disagreed = await request(app)
      .patch("/api/comments/2/vote")
      .set(auth("rogersop"))
      .send({ inc_votes: -1 })
      .expect(200);

    expect(disagreed.body.comment.user_vote).toBe(-1);

    const neutral = await request(app)
      .patch("/api/comments/2/vote")
      .set(auth("rogersop"))
      .send({ inc_votes: -1 })
      .expect(200);

    expect(neutral.body.comment.user_vote).toBe(0);
  });

  test("users cannot vote on their own comments", async () => {
    const { body } = await request(app)
      .patch("/api/comments/2/vote")
      .set(auth("butter_bridge"))
      .send({ inc_votes: 1 })
      .expect(403);

    expect(body.msg).toBe("You cannot vote on your own comment");
  });

  test("comment vote state can be restored for all comments on an article", async () => {
    await request(app)
      .patch("/api/comments/2/vote")
      .set(auth("rogersop"))
      .send({ inc_votes: 1 })
      .expect(200);

    const { body } = await request(app)
      .get("/api/articles/1/comment-votes")
      .set(auth("rogersop"))
      .expect(200);

    expect(body.votes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ comment_id: 2, vote: 1, can_vote: true }),
      ])
    );
  });

  test("comment voting validates input and missing comments", async () => {
    await request(app)
      .patch("/api/comments/2/vote")
      .set(auth("rogersop"))
      .send({ inc_votes: 3 })
      .expect(400);

    await request(app)
      .patch("/api/comments/9999/vote")
      .set(auth("rogersop"))
      .send({ inc_votes: 1 })
      .expect(404);
  });
});

describe("notifications", () => {
  test("following a user creates an unread notification", async () => {
    await request(app)
      .post("/api/users/butter_bridge/follow")
      .set(auth("rogersop"))
      .expect(204);

    const { body } = await request(app)
      .get("/api/users/me/notifications")
      .set(auth("butter_bridge"))
      .expect(200);

    expect(body.unread_count).toBe(1);
    expect(body.notifications[0]).toEqual(
      expect.objectContaining({
        type: "follow",
        actor_username: "rogersop",
        read_at: null,
      })
    );
  });

  test("commenting and replying create notifications for the relevant user", async () => {
    const comment = await request(app)
      .post("/api/articles/1/comments")
      .set(auth("rogersop"))
      .send({ body: "A notification comment" })
      .expect(201);

    const articleOwnerNotifications = await request(app)
      .get("/api/users/me/notifications")
      .set(auth("butter_bridge"))
      .expect(200);

    expect(
      articleOwnerNotifications.body.notifications.map((item) => item.type)
    ).toContain("article_comment");

    await request(app)
      .post("/api/articles/1/comments")
      .set(auth("icellusedkars"))
      .send({
        body: "A notification reply",
        parent_comment_id: comment.body.Comment.comment_id,
      })
      .expect(201);

    const replyNotifications = await request(app)
      .get("/api/users/me/notifications")
      .set(auth("rogersop"))
      .expect(200);

    expect(
      replyNotifications.body.notifications.map((item) => item.type)
    ).toContain("reply");
  });

  test("initial article votes notify the article owner but vote changes do not duplicate notifications", async () => {
    await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: 1 })
      .expect(200);

    await request(app)
      .patch("/api/articles/1")
      .set(auth("rogersop"))
      .send({ inc_votes: -1 })
      .expect(200);

    const { body } = await request(app)
      .get("/api/users/me/notifications")
      .set(auth("butter_bridge"))
      .expect(200);

    expect(
      body.notifications.filter((item) => item.actor_username === "rogersop")
    ).toHaveLength(1);
  });

  test("users can mark one or all notifications as read", async () => {
    await request(app)
      .post("/api/users/butter_bridge/follow")
      .set(auth("rogersop"))
      .expect(204);

    const list = await request(app)
      .get("/api/users/me/notifications")
      .set(auth("butter_bridge"))
      .expect(200);

    const notificationId = list.body.notifications[0].notification_id;

    await request(app)
      .patch("/api/users/me/notifications/" + notificationId + "/read")
      .set(auth("butter_bridge"))
      .expect(200);

    const countAfterOne = await request(app)
      .get("/api/users/me/notifications/count")
      .set(auth("butter_bridge"))
      .expect(200);

    expect(countAfterOne.body.unread_count).toBe(0);

    await request(app)
      .post("/api/users/butter_bridge/follow")
      .set(auth("icellusedkars"))
      .expect(204);

    await request(app)
      .patch("/api/users/me/notifications/read-all")
      .set(auth("butter_bridge"))
      .expect(204);

    const finalCount = await request(app)
      .get("/api/users/me/notifications/count")
      .set(auth("butter_bridge"))
      .expect(200);

    expect(finalCount.body.unread_count).toBe(0);
  });

  test("users cannot mark someone else's notification as read", async () => {
    await request(app)
      .post("/api/users/butter_bridge/follow")
      .set(auth("rogersop"))
      .expect(204);

    const list = await request(app)
      .get("/api/users/me/notifications")
      .set(auth("butter_bridge"))
      .expect(200);

    const notificationId = list.body.notifications[0].notification_id;

    await request(app)
      .patch("/api/users/me/notifications/" + notificationId + "/read")
      .set(auth("rogersop"))
      .expect(404);
  });
});

describe("error handling", () => {
  test("unknown routes return a consistent 404 body", async () => {
    const { body } = await request(app).get("/api/does-not-exist").expect(404);
    expect(body).toEqual({ msg: "Route Not Found" });
  });
});
