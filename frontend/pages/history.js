import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { getHistory, clearAllHistory, getUserStats, isAuthenticated, deleteSession } from "../services/api";
import styles from "./history.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
    else {
      loadHistory();
      loadStats();
    }
  }, [page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getHistory(page, 15);
      setSessions(data.sessions || []);
      setPagination(data.pagination);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch {}
  };

  const handleDelete = async (sessionId) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      toast.success("Conversation deleted");
      if (stats) setStats((s) => ({ ...s, totalSessions: Math.max(0, s.totalSessions - 1) }));
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear ALL chat history? This cannot be undone.")) return;
    try {
      await clearAllHistory();
      setSessions([]);
      setStats((s) => ({ ...s, totalSessions: 0, totalMessages: 0 }));
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  const filtered = sessions.filter((s) =>
    !search || s.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page} data-theme="dark">
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Chat History</h1>
              <p className={styles.subtitle}>Browse and manage your past conversations</p>
            </div>
            {sessions.length > 0 && (
              <button className={`btn btn-danger ${styles.clearBtn}`} onClick={handleClearAll}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Clear All
              </button>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <div className={styles.statsGrid}>
              {[
                { label: "Total Chats", value: stats.totalSessions, icon: "💬" },
                { label: "Messages Sent", value: stats.totalMessages, icon: "✉️" },
                { label: "Tokens Used", value: stats.totalTokens?.toLocaleString() || 0, icon: "⚡" },
              ].map((s) => (
                <div key={s.label} className={styles.statCard}>
                  <span className={styles.statIcon}>{s.icon}</span>
                  <div>
                    <p className={styles.statValue}>{s.value}</p>
                    <p className={styles.statLabel}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className={styles.searchBar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sessions */}
          {loading ? (
            <div className={styles.loadingGrid}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className={`${styles.skeletonCard} skeleton`} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🗒️</div>
              <h3 className={styles.emptyTitle}>
                {search ? "No matching conversations" : "No conversations yet"}
              </h3>
              <p className={styles.emptyText}>
                {search ? "Try a different search term." : "Start a new chat to see your history here."}
              </p>
              {!search && (
                <Link href="/" className="btn btn-primary" style={{ marginTop: "16px", display: "inline-flex" }}>
                  Start Chatting
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className={styles.sessionsGrid}>
                {filtered.map((session) => (
                  <div key={session.sessionId} className={styles.sessionCard}>
                    <div className={styles.sessionCardHeader}>
                      <div className={styles.sessionCardIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(session.sessionId)}
                        title="Delete conversation"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    <h3 className={styles.sessionTitle}>{session.title || "New Conversation"}</h3>

                    <div className={styles.sessionMeta}>
                      <span className={styles.metaBadge}>
                        {session.totalMessages} msg{session.totalMessages !== 1 ? "s" : ""}
                      </span>
                      <span className={styles.metaBadge}>{session.model || "Gemini"}</span>
                      <span className={styles.metaDate}>
                        {session.updatedAt
                          ? format(new Date(session.updatedAt), "MMM d, yyyy")
                          : "–"}
                      </span>
                    </div>

                    <Link
                      href={`/?session=${session.sessionId}`}
                      className={styles.openBtn}
                    >
                      Open Conversation →
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={`btn btn-secondary ${styles.pageBtn}`}
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ← Prev
                  </button>
                  <span className={styles.pageInfo}>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    className={`btn btn-secondary ${styles.pageBtn}`}
                    disabled={page === pagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
