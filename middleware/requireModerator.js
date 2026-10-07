const db = require("../db/connection");

async function requireModerator(req, res, next) {
  try {
    const { rows } = await db.query(
      "SELECT role FROM users WHERE username = $1;",
      [req.user.username]
    );

    if (!rows.length) {
      return next({ status: 401, msg: "Invalid user" });
    }

    if (rows[0].role !== "moderator") {
      return next({ status: 403, msg: "Moderator access required" });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireModerator;
