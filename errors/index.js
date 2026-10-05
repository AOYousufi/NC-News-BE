function routeNotFound(req, res) {
  res.status(404).send({ msg: "Route Not Found" });
}

function handleCustomErrors(error, req, res, next) {
  if (!error.status) return next(error);
  res.status(error.status).send({ msg: error.msg || "Request failed" });
}

function handlePsqlErrors(error, req, res, next) {
  if (error.code === "22P02" || error.code === "23502" || error.code === "23514") {
    return res.status(400).send({ msg: "Bad Request" });
  }
  if (error.code === "23503") {
    return res.status(404).send({ msg: "Not Found" });
  }
  if (error.code === "23505") {
    return res.status(409).send({ msg: "Resource already exists" });
  }
  next(error);
}

function handleServerErrors(error, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(error);
  res.status(500).send({ msg: "Internal Server Error" });
}

module.exports = {
  routeNotFound,
  handleCustomErrors,
  handlePsqlErrors,
  handleServerErrors,
};
