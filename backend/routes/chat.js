const express = require("express");
const router = express.Router();
const {
  chat,
  chatStream,
  createSession,
  deleteSession,
} = require("../controllers/chatController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// All chat routes require authentication
router.use(authMiddleware);

router.post("/", chat);
router.post("/stream", chatStream);
router.post("/session", createSession);
router.delete("/session/:sessionId", deleteSession);

module.exports = router;
