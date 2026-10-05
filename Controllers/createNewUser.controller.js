const { AddNewUser } = require("../Models/createNewUser.model");
const { hashPassword, signToken } = require("../utils/auth");

function isValidUsername(username) {
  return typeof username === "string" && /^[A-Za-z0-9_-]{3,30}$/.test(username);
}

async function createNewUser(req, res, next) {
  try {
    const { username, name, avatar_url, password } = req.body;

    if (
      !isValidUsername(username) ||
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 100 ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128 ||
      (avatar_url !== undefined && typeof avatar_url !== "string")
    ) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const passwordHash = await hashPassword(password);
    const user = await AddNewUser(
      username,
      name.trim(),
      avatar_url || null,
      passwordHash
    );
    const token = signToken(user.username);

    res.status(201).send({ user, token });
  } catch (error) {
    if (error.code === "23505") {
      return next({ status: 409, msg: "Username already exists" });
    }
    next(error);
  }
}

module.exports = createNewUser;
