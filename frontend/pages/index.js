import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import ChatBubble, { TypingIndicator, StreamingBubble } from "../components/ChatBubble";
import ChatInput from "../components/ChatInput";
import { useChat } from "../hooks/useChat";
import { getHistory, isAuthenticated, getStoredUser } from "../services/api";
import styles from "./index.module.css";

// Sidebar session item
function SessionItem({ session, isActive, onClick, onDelete }) {
  return (
    <div
      className={`${styles.sessionItem} ${isActive ? styles.sessionActive : ""}`}
      onClick={onClick}
    >
      <div className={styles.sessionIcon}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className={styles.sessionInfo}>
        <span className={styles.sessionTitle}>{session.title || "New Chat"}</span>
        <span className={styles.sessionMeta}>{session.totalMessages} messages</span>
      </div>
      <button
        className={styles.sessionDelete}
        onClick={(e) => { e.stopPropagation(); onDelete(session.sessionId); }}
        title="Delete"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [model, setModel] = useState("gemini-2.5-flash");

  const {
    messages,
    sessionId,
    isLoading,
    isStreaming,
    streamingContent,
    isConnected,
    error,
    messagesEndRef,
    sendStream,
    resetChat,
    stopStream,
    loadSession,
    deleteSession,
  } = useChat();

  // Auth guard + load current user (client-only)
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setUser(getStoredUser());
    }
  }, [router]);

  // Load sessions
  useEffect(() => {
    loadSessions();
  }, []);

  // Update sessions list when sessionId changes
  useEffect(() => {
    if (sessionId) loadSessions();
  }, [sessionId]);

  const loadSessions = async () => {
    try {
      const data = await getHistory(1, 30);
      setSessions(data.sessions || []);
    } catch (err) {
      // silently fail
    }
  };

  const handleSend = (content) => {
    sendStream(content, model);
  };

  const handleNewChat = () => {
    resetChat();
  };

  const handleLoadSession = async (sid) => {
    await loadSession(sid);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteSession = async (sid) => {
    try {
      const { deleteSession: apiDeleteSession } = await import("../services/api");
      await apiDeleteSession(sid);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sid));
      if (sessionId === sid) resetChat();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.layout} data-theme="dark">
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoMark}>
            <span className={styles.logoIcon}>✦</span>
            <span className={styles.logoText}>Antoniqueee AI</span>
          </div>
          <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <button className={styles.newChatBtn} onClick={handleNewChat}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>

        {/* Model selector */}
        <div className={styles.modelSelector}>
          <label className={styles.modelLabel}>Model</label>
          <select
            className={styles.modelSelect}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
        </div>

        {/* Sessions list */}
        <div className={styles.sessionsList}>
          <span className={styles.sessionsLabel}>Recent Chats</span>
          {sessions.length === 0 ? (
            <p className={styles.noSessions}>No conversations yet</p>
          ) : (
            sessions.map((s) => (
              <SessionItem
                key={s.sessionId}
                session={s}
                isActive={s.sessionId === sessionId}
                onClick={() => handleLoadSession(s.sessionId)}
                onDelete={handleDeleteSession}
              />
            ))
          )}
        </div>

        {/* User info */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className={styles.footerAvatar} />
            ) : (
              <div className={styles.footerAvatarFallback}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div>
              <p className={styles.footerName}>{user?.name}</p>
              <p className={styles.footerStatus}>
                <span className={`${styles.statusDot} ${isConnected ? styles.online : styles.offline}`} />
                {isConnected ? "Connected" : "Offline"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className={styles.topbarTitle}>
            {sessionId ? (
              <span>{sessions.find((s) => s.sessionId === sessionId)?.title || "Chat"}</span>
            ) : (
              <span>New Chat</span>
            )}
          </div>

          <div className={styles.topbarRight}>
            <span className={styles.modelBadge}>{model}</span>
          </div>
        </header>

        {/* Messages */}
        <div className={styles.chatArea}>
          {messages.length === 0 && !isStreaming ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyLogo}>✦</div>
              <h1 className={styles.emptyTitle}>Antoniqueee AI</h1>
              <p className={styles.emptySubtitle}>
                Your intelligent assistant. Ask me anything — code, writing, analysis, ideas.
              </p>
              <div className={styles.suggestions}>
                {[
                  "Explain quantum computing simply",
                  "Write a React component for a modal",
                  "What are the best practices for REST APIs?",
                  "Help me write a cover letter",
                ].map((s) => (
                  <button
                    key={s}
                    className={styles.suggestionChip}
                    onClick={() => handleSend(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map((msg, i) => (
                <ChatBubble
                  key={msg._id || i}
                  message={msg}
                  isLast={i === messages.length - 1}
                />
              ))}

              {isLoading && !isStreaming && <TypingIndicator />}
              {isStreaming && streamingContent && (
                <StreamingBubble content={streamingContent} />
              )}
              {isStreaming && !streamingContent && <TypingIndicator />}

              {error && (
                <div className={styles.errorMsg}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onStop={stopStream}
          isLoading={isLoading}
          isStreaming={isStreaming}
        />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
