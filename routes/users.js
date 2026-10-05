const express = require("express");
const authenticateUser = require("../middleware/auth");
const fetchUserByUserName = require("../Controllers/fetchUserByUserName.controller");
const fetchAllUsers = require("../Controllers/fetchAllUsers.controller");
const createNewUser = require("../Controllers/createNewUser.controller");
const loginUser = require("../Controllers/loginUser.controller");
const getCurrentUser = require("../Controllers/getCurrentUser.controller");
const updateCurrentUser = require("../Controllers/updateCurrentUser.controller");

const router = express.Router();

router.get("/", fetchAllUsers);
router.post("/signup", createNewUser);
router.post("/register", createNewUser);
router.post("/login", loginUser);
router.get("/me", authenticateUser, getCurrentUser);
router.patch("/me", authenticateUser, updateCurrentUser);
router.get("/:username", fetchUserByUserName);

module.exports = router;
