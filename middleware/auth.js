const { verifyToken } = require("../utils/auth");

function authenticateUser(req, res, next) {
  const header = req.get("authorization");

  if (!header || !header.startsWith("Bearer ")) {
    return next({ status: 401, msg: "Authentication required" });
  }

  const token = header.slice(7).trim();
  if (!token) {
    return next({ status: 401, msg: "Authentication required" });
  }

  try {
    const payload = verifyToken(token);
    req.user = { username: payload.sub };
    next();
  } catch (error) {
    next({ status: 401, msg: "Invalid or expired token" });
  }
}

module.exports = authenticateUser;
