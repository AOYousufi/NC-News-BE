const express = require("express");
const cors = require("cors");
const userRouter = require("./routes/users");
const articleRouter = require("./routes/article");
const topicRouter = require("./routes/topics");
const commentRouter = require("./routes/comments");
const getAllApi = require("./Controllers/getAPI.controller.js");
const {
  routeNotFound,
  handleCustomErrors,
  handlePsqlErrors,
  handleServerErrors,
} = require("./errors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", getAllApi);
app.use("/api/users", userRouter);
app.use("/api/articles", articleRouter);
app.use("/api/topics", topicRouter);
app.use("/api/comments", commentRouter);

app.use(routeNotFound);
app.use(handleCustomErrors);
app.use(handlePsqlErrors);
app.use(handleServerErrors);

module.exports = app;
