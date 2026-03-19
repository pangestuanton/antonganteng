const Session = require("../models/Session");
const Message = require("../models/Message");

/**
 * GET /api/history
 * Get all chat sessions for the current user
 */
const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      Session.find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Session.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ error: "Failed to fetch chat history." });
  }
};

/**
 * GET /api/history/:sessionId
 * Get all messages for a specific session
 */
const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify session ownership
    const session = await Session.findOne({
      sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const [messages, total] = await Promise.all([
      Message.find({ sessionId })
        .sort({ timestamp: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Message.countDocuments({ sessionId }),
    ]);

    res.json({
      session,
      messages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

/**
 * DELETE /api/history
 * Clear all chat history for the current user
 */
const clearAllHistory = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).select("sessionId");
    const sessionIds = sessions.map((s) => s.sessionId);

    await Promise.all([
      Session.deleteMany({ userId: req.user._id }),
      Message.deleteMany({ sessionId: { $in: sessionIds } }),
    ]);

    res.json({ message: "All chat history cleared." });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear history." });
  }
};

/**
 * GET /api/history/stats
 * Get user stats
 */
const getStats = async (req, res) => {
  try {
    const [totalSessions, totalMessages] = await Promise.all([
      Session.countDocuments({ userId: req.user._id }),
      Message.countDocuments({ userId: req.user._id, sender: "user" }),
    ]);

    const tokenUsage = await Session.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, totalTokens: { $sum: "$totalTokens" } } },
    ]);

    res.json({
      totalSessions,
      totalMessages,
      totalTokens: tokenUsage[0]?.totalTokens || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
};

module.exports = { getSessions, getSessionMessages, clearAllHistory, getStats };
