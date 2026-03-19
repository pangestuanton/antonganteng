const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      maxlength: [10000, "Message too long"],
    },
    tokens: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    model: {
      type: String,
      default: "gemini-1.5-flash",
    },
    isStreamed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "complete", "error"],
      default: "complete",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ sessionId: 1, timestamp: 1 });
messageSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("Message", messageSchema);
