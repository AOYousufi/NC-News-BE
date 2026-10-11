const express = require("express");
const cors = require("cors");
const userRouter = require("./routes/users");
const articleRouter = require("./routes/article");
const topicRouter = require("./routes/topics");
const commentRouter = require("./routes/comments");
const reportRouter = require("./routes/reports");
const moderationRouter = require("./routes/moderation");
const collectionRouter = require("./routes/collections");
const getAllApi = require("./Controllers/getAPI.controller.js");
const { health, readiness } = require("./Controllers/health.controller");
const requestLogger = require("./middleware/requestLogger");
const { corsOptions, securityHeaders } = require("./middleware/security");
const {
  authRateLimiter,
  writeRateLimiter,
} = require("./middleware/rateLimit");
const {
  routeNotFound,
  handleCustomErrors,
  handlePsqlErrors,
  handleServerErrors,
} = require("./errors");

const app = express();

app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(express.json({ limit: "100kb" }));
app.use(requestLogger);

app.get("/healthz", health);
app.get("/readyz", readiness);
app.get("/api", getAllApi);
app.use("/api/users/login", authRateLimiter);
app.use("/api/users/register", authRateLimiter);
app.use("/api/users/signup", authRateLimiter);
app.use("/api", writeRateLimiter);
app.use("/api/users", userRouter);
app.use("/api/articles", articleRouter);
app.use("/api/topics", topicRouter);
app.use("/api/comments", commentRouter);
app.use("/api/reports", reportRouter);
app.use("/api/moderation", moderationRouter);
app.use("/api/collections", collectionRouter);

app.use(routeNotFound);
app.use(handleCustomErrors);
app.use(handlePsqlErrors);
app.use(handleServerErrors);

module.exports = app;
