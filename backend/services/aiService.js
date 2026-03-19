const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const isDummyMode = !API_KEY;

if (isDummyMode) {
  console.warn("⚠️ Gemini API key not configured. Running in dummy (offline) mode.");
}

const genAI = isDummyMode ? null : new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `You are Antoniqueee AI, a highly intelligent and friendly AI assistant created to help users with any questions, tasks, coding problems, creative writing, analysis, and more. 

You are:
- Helpful, accurate, and concise
- Able to write and debug code in any language
- Great at explaining complex concepts simply
- Creative and engaging in conversations
- Always honest about your limitations

Respond naturally and conversationally. Use markdown formatting when helpful (code blocks, lists, headers).`;

const createDummyResponse = (messages) => {
  const lastUser = messages.filter((m) => m.sender === "user").slice(-1)[0];
  const userText = lastUser?.content ?? "(no message)";

  return `🚧 **Demo mode**: Gemini API key not configured.

Your question was: **${userText}**

To enable real responses, add **GEMINI_API_KEY** to your backend environment and restart the server.

Meanwhile, here's a friendly placeholder response: ✅

> _This is a simulated response to help you test the chat UI._`;
};

// Gemini model names should use the `models/` prefix for the Generative AI API.
// Example: `models/gemini-1.5-flash`.
const normalizeModelName = (model) => {
  if (!model) return model;
  return model.startsWith("models/") ? model : `models/${model}`;
};

/**
 * Send a chat message (NON STREAM)
 */
const sendMessage = async (messages, model = "gemini-2.5-flash") => {
  // If no API key is available, return a fake response so UI can be tested offline.
  if (isDummyMode) {
    return {
      content: createDummyResponse(messages),
      tokens: { total: 0 },
      model: "dummy",
      finishReason: "stop",
    };
  }

  try {
    const apiModel = normalizeModelName(model);
    const modelAI = genAI.getGenerativeModel({ model: apiModel });

    // convert history → text
    const historyText = messages
      .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    const prompt = `${SYSTEM_PROMPT}\n\n${historyText}\nAssistant:`;

    const result = await modelAI.generateContent(prompt);
    const text = result.response.text();

    return {
      content: text,
      tokens: { total: 0 }, // gemini ga kasih detail token
      model,
      finishReason: "stop",
    };
  } catch (err) {
    console.error("Gemini API error:", err);

    // If the requested Gemini model is unavailable (404), fall back to a supported model.
    const errMsg = (err.message || "").toLowerCase();
    const isNotFound = errMsg.includes("404") || errMsg.includes("not found");
    if (isNotFound && model !== "gemini-1.5-flash") {
      console.warn(`Falling back from model ${model} to gemini-1.5-flash due to model not found.`);
      return sendMessage(messages, "gemini-1.5-flash");
    }

    if (err.message?.includes("quota")) {
      throw new Error("Quota Gemini habis bro 😅");
    }

    throw new Error(err.message || "AI service unavailable.");
  }
};

/**
 * STREAM (simple fake streaming biar ga ribet dulu)
 */
const streamMessage = async (messages, onChunk, onComplete, model = "gemini-1.5-flash") => {
  // If no API key is available, stream a dummy response (so the UI can be tested). 
  if (isDummyMode) {
    const result = await sendMessage(messages, model);
    const words = result.content.split(" ");

    let full = "";
    for (const word of words) {
      full += word + " ";
      onChunk(word + " ");
      await new Promise((r) => setTimeout(r, 40));
    }

    onComplete({
      content: full.trim(),
      tokens: { total: 0 },
      model: "dummy",
    });
    return;
  }

  try {
    const result = await sendMessage(messages, model);

    // fake streaming (biar frontend lo tetap jalan)
    const words = result.content.split(" ");

    let full = "";
    for (const word of words) {
      full += word + " ";
      onChunk(word + " ");
      await new Promise((r) => setTimeout(r, 20)); // delay biar keliatan streaming
    }

    onComplete({
      content: full.trim(),
      tokens: { total: 0 },
      model,
    });
  } catch (err) {
    console.error("Streaming error:", err);
    throw new Error(err.message || "Streaming failed.");
  }
};

/**
 * Generate session title
 */
const generateSessionTitle = async (firstMessage) => {
  if (isDummyMode) {
    return `Chat: ${firstMessage?.slice(0, 20) || "New Conversation"}`;
  }

  try {
    const apiModel = normalizeModelName("gemini-2.5-flash");
    const modelAI = genAI.getGenerativeModel({
      model: apiModel,
    });

    const prompt = `Buat judul singkat (max 6 kata) untuk percakapan yang dimulai dengan: "${firstMessage}". Hanya judul saja.`;

    const result = await modelAI.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "New Conversation";
  }
};

module.exports = { sendMessage, streamMessage, generateSessionTitle };