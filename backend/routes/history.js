const express = require("express");
const router = express.Router();
const {
  getSessions,
  getSessionMessages,
  clearAllHistory,
  getStats,
} = require("../controllers/historyController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// All history routes require authentication
router.use(authMiddleware);

router.get("/", getSessions);
router.get("/stats", getStats);
router.get("/:sessionId", getSessionMessages);
router.delete("/", clearAllHistory);

module.exports = router;
