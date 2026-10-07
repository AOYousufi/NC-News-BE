const db = require("../db/connection");

function health(req, res) {
  res.status(200).send({
    status: "ok",
    service: "nc-news-api",
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

async function readiness(req, res) {
  try {
    await db.query("SELECT 1;");
    res.status(200).send({
      status: "ready",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).send({
      status: "not-ready",
      database: "down",
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = { health, readiness };
