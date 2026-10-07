const {
  findUserForAuthentication,
  updatePasswordHash,
} = require("../Models/auth.model");
const { hashPassword, verifyPassword } = require("../utils/auth");

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body || {};

    if (
      typeof current_password !== "string" ||
      typeof new_password !== "string" ||
      new_password.length < 8 ||
      new_password.length > 128
    ) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const user = await findUserForAuthentication(req.user.username);
    const matches = user
      ? await verifyPassword(current_password, user.password_hash)
      : false;

    if (!matches) {
      return next({ status: 401, msg: "Current password is incorrect" });
    }

    if (current_password === new_password) {
      return next({
        status: 400,
        msg: "New password must be different",
      });
    }

    const passwordHash = await hashPassword(new_password);
    await updatePasswordHash(req.user.username, passwordHash);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = changePassword;
