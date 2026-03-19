const express = require("express");
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  googleCallback,
  getMe,
  updateSettings,
  logout,
} = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Email/Password auth
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

// Google OAuth
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// Protected routes
router.get("/me", authMiddleware, getMe);
router.put("/settings", authMiddleware, updateSettings);

module.exports = router;
