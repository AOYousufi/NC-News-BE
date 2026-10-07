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
});
