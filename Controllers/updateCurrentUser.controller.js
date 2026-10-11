const { updateUserProfile } = require("../Models/auth.model");

async function updateCurrentUser(req, res, next) {
  try {
    const allowed = new Set(["name", "avatar_url", "bio", "pinned_article_id"]);
    const keys = Object.keys(req.body || {});

    if (!keys.length || keys.some((key) => !allowed.has(key))) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const { name, avatar_url, bio, pinned_article_id } = req.body;

    if (
      (name !== undefined &&
        (typeof name !== "string" ||
          name.trim().length === 0 ||
          name.trim().length > 100)) ||
      (avatar_url !== undefined && typeof avatar_url !== "string") ||
      (bio !== undefined &&
        (typeof bio !== "string" || bio.trim().length > 500)) ||
      (pinned_article_id !== undefined &&
        pinned_article_id !== null &&
        (!Number.isInteger(pinned_article_id) || pinned_article_id <= 0))
    ) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const user = await updateUserProfile(req.user.username, {
      name: name === undefined ? undefined : name.trim(),
      avatar_url,
      bio: bio === undefined ? undefined : bio.trim(),
      pinned_article_id,
    });

    if (!user) return next({ status: 404, msg: "User Not Found" });
    res.status(200).send({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = updateCurrentUser;
