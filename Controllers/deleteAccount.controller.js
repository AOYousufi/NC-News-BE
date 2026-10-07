const deleteAccount = require("../Models/deleteAccount.model");
const { findUserForAuthentication } = require("../Models/auth.model");
const { verifyPassword } = require("../utils/auth");

async function deleteAccountController(req, res, next) {
  try {
    const { password, confirmation } = req.body || {};

    if (
      typeof password !== "string" ||
      typeof confirmation !== "string" ||
      confirmation !== req.user.username
    ) {
      return next({ status: 400, msg: "Bad Request" });
    }

    const user = await findUserForAuthentication(req.user.username);
    const matches = user
      ? await verifyPassword(password, user.password_hash)
      : false;

    if (!matches) {
      return next({ status: 401, msg: "Current password is incorrect" });
    }

    await deleteAccount(req.user.username);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = deleteAccountController;
