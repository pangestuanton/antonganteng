import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { sendMessage, streamMessage, createSession, getSessionMessages, getStoredToken } from "../services/api";
import toast from "react-hot-toast";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export function useChat(initialSessionId = null) {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const streamCleanupRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ─── Auto-scroll ─────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // ─── Socket.IO Connection ─────────────────────────────────────────────────
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      if (sessionId) socket.emit("join_session", sessionId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
      setIsConnected(false);
    });

    socket.on("new_message", (data) => {
      if (data.sessionId === sessionId) {
        setMessages((prev) => {
          const exists = prev.find((m) => m._id === data.message._id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line

  // ─── Join session when sessionId changes ──────────────────────────────────
  useEffect(() => {
    if (socketRef.current && sessionId) {
      socketRef.current.emit("join_session", sessionId);
    }
  }, [sessionId]);

  // ─── Load existing session messages ──────────────────────────────────────
  const loadSession = useCallback(async (sid) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSessionMessages(sid);
      setMessages(data.messages || []);
      setSessionId(sid);
    } catch (err) {
      setError("Failed to load chat history.");
      toast.error("Failed to load chat history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Send message (non-streaming) ────────────────────────────────────────
  const send = useCallback(async (content, model = "gemini-2.5-flash") => {
    if (!content.trim() || isLoading || isStreaming) return;

    setError(null);

    // Optimistic user message
    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      sender: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isTemp: true,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const data = await sendMessage(content, sessionId, model);

      if (!sessionId) setSessionId(data.sessionId);

      // Replace temp + add AI
      setMessages((prev) =>
        prev
          .filter((m) => m._id !== tempUserMsg._id)
          .concat([data.userMessage, data.aiMessage])
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempUserMsg._id));
      setError(err.error || "Failed to send message.");
      toast.error(err.error || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, isStreaming]);

  // ─── Send message with streaming ─────────────────────────────────────────
  const sendStream = useCallback(async (content, model = "gemini-2.5-flash") => {
    if (!content.trim() || isLoading || isStreaming) return;

    setError(null);

    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      sender: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isTemp: true,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingContent("");

    // Cleanup previous stream
    if (streamCleanupRef.current) streamCleanupRef.current();

    const cleanup = streamMessage(
      content,
      sessionId,
      (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      },
      (aiMessage) => {
        setIsStreaming(false);
        setStreamingContent("");

        if (aiMessage.sessionId && !sessionId) {
          setSessionId(aiMessage.sessionId);
          return;
        }

        if (aiMessage._id) {
          setMessages((prev) =>
            prev
              .filter((m) => m._id !== tempUserMsg._id)
              .concat([
                { ...tempUserMsg, isTemp: false },
                aiMessage,
              ])
          );
        }
      },
      (errMsg) => {
        setIsStreaming(false);
        setStreamingContent("");
        setMessages((prev) => prev.filter((m) => m._id !== tempUserMsg._id));
        setError(errMsg);
        toast.error(errMsg || "Stream failed");
      },
      model
    );

    streamCleanupRef.current = cleanup;
  }, [sessionId, isLoading, isStreaming]);

  // ─── Clear / reset chat ───────────────────────────────────────────────────
  const resetChat = useCallback(() => {
    if (streamCleanupRef.current) streamCleanupRef.current();
    setMessages([]);
    setSessionId(null);
    setStreamingContent("");
    setIsStreaming(false);
    setIsLoading(false);
    setError(null);
  }, []);

  // ─── Stop streaming ───────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      setIsStreaming(false);
      setStreamingContent("");
    }
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    isStreaming,
    streamingContent,
    isConnected,
    error,
    messagesEndRef,
    send,
    sendStream,
    resetChat,
    stopStream,
    loadSession,
    setSessionId,
  };
}
