const express = require("express");
const router = express.Router();

const userController = require("../controller/userController");
const authMiddleware = require("../middleware/authMiddleware");

console.log("Auth Middleware:", typeof authMiddleware);
console.log("User Controller:", typeof userController);
console.log("Get Profile:", typeof userController.getProfile);

router.get("/profile", (req, res) => {
    res.send("User profile route is working");
});

module.exports = router;