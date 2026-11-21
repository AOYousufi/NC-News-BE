const express = require("express");
const request = require("supertest");
const requestLogger = require("../middleware/requestLogger");

describe("request logging privacy", () => {
  let previousNodeEnv;
  let logSpy;

  beforeEach(() => {
    previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  test("logs the route path without query parameters or sensitive values", async () => {
    const app = express();
    app.use(requestLogger);
    app.get("/api/articles", (_req, res) => res.sendStatus(204));

    await request(app)
      .get("/api/articles?search=hello&token=private-token-123")
      .expect(204);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const rawLog = logSpy.mock.calls[0][0];
    const entry = JSON.parse(rawLog);

    expect(entry).toMatchObject({
      event: "http_request",
      method: "GET",
      path: "/api/articles",
      status: 204,
    });
    expect(rawLog).not.toContain("private-token-123");
    expect(rawLog).not.toContain("search=hello");
  });

  test("preserves the request ID for correlation", async () => {
    const app = express();
    app.use(requestLogger);
    app.get("/healthz", (_req, res) => res.sendStatus(200));

    const response = await request(app)
      .get("/healthz?secret=hidden")
      .set("X-Request-Id", "trace-123")
      .expect(200);

    expect(response.headers["x-request-id"]).toBe("trace-123");
    const entry = JSON.parse(logSpy.mock.calls[0][0]);
    expect(entry.request_id).toBe("trace-123");
    expect(entry.path).toBe("/healthz");
  });
});
