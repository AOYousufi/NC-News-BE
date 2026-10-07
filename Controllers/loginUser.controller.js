const { findUserForAuthentication } = require("../Models/auth.model");
const { verifyPassword, signToken } = require("../utils/auth");

async function loginUser(req, res, next) {
  try {
    const { username, password } = req.body;

    if (typeof username !== "string" || typeof password !== "string") {
      return next({ status: 400, msg: "Bad Request" });
    }

    const user = await findUserForAuthentication(username);
    const passwordMatches = user
      ? await verifyPassword(password, user.password_hash)
      : false;

    if (!user || !passwordMatches) {
      return next({ status: 401, msg: "Invalid username or password" });
    }

    const token = signToken(user.username);
    res.status(200).send({
      user: {
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = loginUser;
