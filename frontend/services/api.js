import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor: attach token ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("antoniqueee_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle auth errors ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("antoniqueee_token");
        localStorage.removeItem("antoniqueee_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const loginEmail = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  if (res.data.token) {
    localStorage.setItem("antoniqueee_token", res.data.token);
    localStorage.setItem("antoniqueee_user", JSON.stringify(res.data.user));
  }
  return res.data;
};

export const registerEmail = async (name, email, password) => {
  const res = await api.post("/auth/register", { name, email, password });
  if (res.data.token) {
    localStorage.setItem("antoniqueee_token", res.data.token);
    localStorage.setItem("antoniqueee_user", JSON.stringify(res.data.user));
  }
  return res.data;
};

export const loginGoogle = () => {
  window.location.href = `${API_URL}/auth/google`;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("antoniqueee_token");
    localStorage.removeItem("antoniqueee_user");
    window.location.href = "/login";
  }
};

export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data.user;
};

export const updateSettings = async (settings) => {
  const res = await api.put("/auth/settings", settings);
  return res.data;
};

// ─── Chat API ─────────────────────────────────────────────────────────────────
export const sendMessage = async (message, sessionId = null, model = "gemini-2.5-flash") => {
  const res = await api.post("/chat", { message, sessionId, model });
  return res.data;
};

export const createSession = async (model = "gemini-2.5-flash") => {
  const res = await api.post("/chat/session", { model });
  return res.data.session;
};

export const deleteSession = async (sessionId) => {
  const res = await api.delete(`/chat/session/${sessionId}`);
  return res.data;
};

/**
 * Stream a chat message using EventSource (SSE)
 * Returns cleanup function
 */
export const streamMessage = (message, sessionId, onChunk, onComplete, onError, model = "gemini-2.5-flash") => {
  const token = typeof window !== "undefined" ? localStorage.getItem("antoniqueee_token") : "";

  // Use fetch for POST + streaming
  const controller = new AbortController();

  fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, sessionId, model }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Stream request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const eventLine = lines[lines.indexOf(line) - 1];
              const event = eventLine?.startsWith("event: ")
                ? eventLine.slice(7)
                : "message";

              if (event === "chunk") onChunk(data.content);
              else if (event === "complete") onComplete(data.message);
              else if (event === "session") onComplete({ sessionId: data.sessionId });
              else if (event === "error") onError(data.error);
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") onError(err.message);
    });

  return () => controller.abort();
};

// ─── History API ──────────────────────────────────────────────────────────────
export const getHistory = async (page = 1, limit = 20) => {
  const res = await api.get(`/history?page=${page}&limit=${limit}`);
  return res.data;
};

export const getSessionMessages = async (sessionId, page = 1) => {
  const res = await api.get(`/history/${sessionId}?page=${page}`);
  return res.data;
};

export const clearAllHistory = async () => {
  const res = await api.delete("/history");
  return res.data;
};

export const getUserStats = async () => {
  const res = await api.get("/history/stats");
  return res.data;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const u = localStorage.getItem("antoniqueee_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("antoniqueee_token");
};

export const isAuthenticated = () => !!getStoredToken();

export default api;
