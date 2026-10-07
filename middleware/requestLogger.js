const { randomUUID } = require("crypto");

function requestLogger(req, res, next) {
  const requestId = req.get("x-request-id") || randomUUID();
  const startedAt = process.hrtime.bigint();

  req.requestId = requestId;
  res.set("X-Request-Id", requestId);

  res.on("finish", () => {
    if (process.env.NODE_ENV === "test") return;

    const durationMs =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    console.log(
      JSON.stringify({
        level: "info",
        event: "http_request",
        request_id: requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration_ms: Number(durationMs.toFixed(1)),
        timestamp: new Date().toISOString(),
      })
    );
  });

  next();
}

module.exports = requestLogger;
