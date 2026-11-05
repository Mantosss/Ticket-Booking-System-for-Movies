
const express = require("express");
const router = express.Router();

const authController = require("../controller/authController");

// Signup routes
router.get("/signup", authController.signupPage);
router.post("/signup", authController.signup);

// Email verification
router.get("/verify-email/:token", authController.verifyEmail);

// Login routes
router.get("/login", authController.loginPage);
router.post("/login", authController.login);

// Logout
router.get("/logout", authController.logout);

module.exports = router;
