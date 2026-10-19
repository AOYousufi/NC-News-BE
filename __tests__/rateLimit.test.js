const express = require("express");
const request = require("supertest");
const {
  createRateLimiter,
  resetRateLimits,
} = require("../middleware/rateLimit");

describe("rate limiting", () => {
  beforeEach(() => resetRateLimits());

  test("allows requests below the limit and blocks requests above it", async () => {
    const app = express();
    app.use(
      createRateLimiter({
        windowMs: 60_000,
        max: 2,
        message: "Slow down",
      })
    );
    app.get("/", (req, res) => res.status(200).send({ ok: true }));

    await request(app).get("/").expect(200);
    await request(app).get("/").expect(200);

    const response = await request(app).get("/").expect(429);

    expect(response.body).toEqual({ msg: "Slow down" });
    expect(Number(response.headers["retry-after"])).toBeGreaterThan(0);
  });

  test("can skip safe requests while limiting writes", async () => {
    const app = express();
    app.use(
      createRateLimiter({
        windowMs: 60_000,
        max: 1,
        skip: (req) => req.method === "GET",
      })
    );
    app.get("/", (req, res) => res.status(200).send({ ok: true }));
    app.post("/", (req, res) => res.status(204).send());

    await request(app).get("/").expect(200);
    await request(app).get("/").expect(200);
    await request(app).post("/").expect(204);
    await request(app).post("/").expect(429);
  });

  test("shares a write quota across different resource IDs", async () => {
    const app = express();
    app.use("/api", createRateLimiter({ windowMs: 60_000, max: 2 }));
    app.post("/api/articles/:id/comments", (req, res) => res.sendStatus(204));

    await request(app).post("/api/articles/1/comments").expect(204);
    await request(app).post("/api/articles/2/comments").expect(204);
    await request(app).post("/api/articles/3/comments").expect(429);
  });

  test("keeps quotas separate for different mounted authentication routes", async () => {
    const app = express();
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    app.use("/api/users/login", limiter);
    app.use("/api/users/register", limiter);
    app.post("/api/users/login", (req, res) => res.sendStatus(204));
    app.post("/api/users/register", (req, res) => res.sendStatus(204));

    await request(app).post("/api/users/login").expect(204);
    await request(app).post("/api/users/register").expect(204);
    await request(app).post("/api/users/login").expect(429);
  });
});
