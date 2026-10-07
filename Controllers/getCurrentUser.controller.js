const db = require("../db/connection");

async function getCurrentUser(req, res, next) {
  try {
    const { rows } = await db.query(
      "SELECT username, name, avatar_url, role FROM users WHERE username = $1;",
      [req.user.username]
    );
    const user = rows[0];
    if (!user) return next({ status: 401, msg: "Invalid user" });
    res.status(200).send({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = getCurrentUser;
