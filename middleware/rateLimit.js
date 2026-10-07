const buckets = new Map();

function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests. Please try again later.",
  skip,
} = {}) {
  return function rateLimiter(req, res, next) {
    if (skip?.(req)) return next();

    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const bucketKey = key + ":" + req.baseUrl + ":" + (req.route?.path || req.path);
    const existing = buckets.get(bucketKey);

    if (!existing || now >= existing.resetAt) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;

    if (existing.count > max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      );
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).send({ msg: message });
    }

    return next();
  };
}

function resetRateLimits() {
  buckets.clear();
}

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many authentication attempts. Please try again later.",
});

const writeRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many write requests. Please try again later.",
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
});

module.exports = {
  authRateLimiter,
  createRateLimiter,
  resetRateLimits,
  writeRateLimiter,
};
