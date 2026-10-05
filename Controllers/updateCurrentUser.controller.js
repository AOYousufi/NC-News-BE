const { updateUserProfile } = require("../Models/auth.model");

async function updateCurrentUser(req, res, next) {
  try {
    const { name, avatar_url } = req.body;

    if (name === undefined && avatar_url === undefined) {
      return next({ status: 400, msg: "Bad Request" });
    }
    if (
      (name !== undefined &&
        (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 100)) ||
      (avatar_url !== undefined && typeof avatar_url !== "string")
    ) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const user = await updateUserProfile(req.user.username, {
      name: name === undefined ? undefined : name.trim(),
      avatar_url,
    });

    if (!user) return next({ status: 404, msg: "User Not Found" });
    res.status(200).send({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = updateCurrentUser;
