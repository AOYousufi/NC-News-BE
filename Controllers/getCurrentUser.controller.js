const fetchUser = require("../Models/fetchUserByUsername.model");

async function getCurrentUser(req, res, next) {
  try {
    const user = await fetchUser(req.user.username);
    if (!user) return next({ status: 401, msg: "Invalid user" });
    res.status(200).send({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = getCurrentUser;
