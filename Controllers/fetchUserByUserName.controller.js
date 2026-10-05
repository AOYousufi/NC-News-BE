const fetchUser = require("../Models/fetchUserByUsername.model");

async function fetchUserByUserName(req, res, next) {
  try {
    const user = await fetchUser(req.params.username);
    if (!user) return next({ status: 404, msg: "User Not Found" });
    res.status(200).send(user);
  } catch (error) {
    next(error);
  }
}

module.exports = fetchUserByUserName;
