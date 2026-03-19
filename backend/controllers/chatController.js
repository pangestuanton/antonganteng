const Message = require("../models/Message");
const Session = require("../models/Session");
const { sendMessage, streamMessage, generateSessionTitle } = require("../services/aiService");
const crypto = require("crypto");

// Allowlist of supported Gemini models (as of current implementation)
const ALLOWED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
];

const normalizeModel = (model) => {
  if (!model) return "gemini-2.5-flash";
  if (ALLOWED_MODELS.includes(model)) return model;
  return "gemini-2.5-flash";
};

/**
 * POST /api/chat
 */
const chat = async (req, res) => {
  try {
    const { message, sessionId, model: requestedModel } = req.body;
    const model = normalizeModel(requestedModel);
    const userId = req.user._id;

    console.log("REQ BODY:", req.body);
    console.log("MODEL DIPAKAI:", model);

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message content is required." });
    }

    let session;

    if (sessionId) {
      session = await Session.findOne({ sessionId, userId });
      if (!session) {
        return res.status(404).json({ error: "Session not found." });
      }
    } else {
      session = await Session.create({
        sessionId: crypto.randomUUID(),
        userId,
        model,
        title: "New Chat",
      });
    }

    const userMessage = await Message.create({
      sessionId: session.sessionId,
      userId,
      sender: "user",
      content: message.trim(),
      model,
    });

    const history = await Message.find({ sessionId: session.sessionId })
      .sort({ timestamp: 1 })
      .limit(20)
      .select("sender content");

    const aiResponse = await sendMessage(history, model);

    const aiMessage = await Message.create({
      sessionId: session.sessionId,
      userId,
      sender: "assistant",
      content: aiResponse.content,
      tokens: aiResponse.tokens,
      model: model,
    });

    await Session.findByIdAndUpdate(session._id, {
      $inc: {
        totalMessages: 2,
        totalTokens: aiResponse.tokens.total || 0,
      },
    });

    if (session.totalMessages === 0) {
      const title = await generateSessionTitle(message);
      await Session.findByIdAndUpdate(session._id, { title });
      session.title = title;
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`session:${session.sessionId}`).emit("new_message", {
        message: aiMessage,
        sessionId: session.sessionId,
      });
    }

    res.json({
      sessionId: session.sessionId,
      sessionTitle: session.title,
      userMessage,
      aiMessage,
    });
  } catch (err) {
    console.error("Chat controller error:", err);
    res.status(500).json({ error: err.message || "Chat request failed." });
  }
};

/**
 * POST /api/chat/stream
 */
const chatStream = async (req, res) => {
  try {
    const { message, sessionId, model: requestedModel } = req.body;
    const model = normalizeModel(requestedModel) || "gemini-1.5-flash";
    const userId = req.user._id;

    console.log("STREAM REQ:", req.body);

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message content is required." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let session;

    if (sessionId) {
      session = await Session.findOne({ sessionId, userId });
      if (!session) {
        sendEvent("error", { error: "Session not found" });
        return res.end();
      }
    } else {
      session = await Session.create({
        sessionId: crypto.randomUUID(),
        userId,
        model,
        title: "New Chat",
      });
    }

    sendEvent("session", { sessionId: session.sessionId });

    const userMessage = await Message.create({
      sessionId: session.sessionId,
      userId,
      sender: "user",
      content: message.trim(),
      model,
    });

    sendEvent("user_message", { message: userMessage });

    const history = await Message.find({ sessionId: session.sessionId })
      .sort({ timestamp: 1 })
      .limit(20)
      .select("sender content");

    let fullContent = "";

    await streamMessage(
      history,
      (chunk) => {
        fullContent += chunk;
        sendEvent("chunk", { content: chunk });
      },
      async (result) => {
        const aiMessage = await Message.create({
          sessionId: session.sessionId,
          userId,
          sender: "assistant",
          content: result.content,
          model,
          isStreamed: true,
        });

        await Session.findByIdAndUpdate(session._id, {
          $inc: { totalMessages: 2 },
        });

        if (session.totalMessages === 0) {
          const title = await generateSessionTitle(message);
          await Session.findByIdAndUpdate(session._id, { title });
          sendEvent("session_title", { title });
        }

        sendEvent("complete", { message: aiMessage });
        res.end();
      },
      model
    );
  } catch (err) {
    console.error("Stream error:", err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

/**
 * POST /api/chat/session
 */
const createSession = async (req, res) => {
  try {
    const { model: requestedModel } = req.body;
    const model = normalizeModel(requestedModel) || "gemini-1.5-flash";

    const session = await Session.create({
      sessionId: crypto.randomUUID(),
      userId: req.user._id,
      model,
    });

    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: "Failed to create session." });
  }
};

/**
 * DELETE /api/chat/session/:sessionId
 */
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    await Promise.all([
      Session.deleteOne({ _id: session._id }),
      Message.deleteMany({ sessionId }),
    ]);

    res.json({ message: "Session deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete session." });
  }
};

module.exports = { chat, chatStream, createSession, deleteSession };