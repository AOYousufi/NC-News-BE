const fetchUsers = require("../Models/fetchUsers.model");

async function fetchAllUsers(req, res, next) {
  try {
    const users = await fetchUsers();
    res.status(200).send({ users });
  } catch (error) {
    next(error);
  }
}

module.exports = fetchAllUsers;
