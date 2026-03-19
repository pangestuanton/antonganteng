import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { logout, getStoredUser } from "../services/api";
import styles from "./Navbar.module.css";

export default function Navbar({ onToggleSidebar, showSidebarToggle = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || "?";

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        {showSidebarToggle && (
          <button
            className={styles.iconBtn}
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          <span className={styles.logoText}>Antoniqueee AI</span>
        </Link>
      </div>

      <div className={styles.right}>
        <Link
          href="/"
          className={`${styles.navLink} ${router.pathname === "/" ? styles.active : ""}`}
        >
          Chat
        </Link>
        <Link
          href="/history"
          className={`${styles.navLink} ${router.pathname === "/history" ? styles.active : ""}`}
        >
          History
        </Link>

        {user ? (
          <div className={styles.userMenu}>
            <button
              className={styles.avatarBtn}
              onClick={() => setShowMenu(!showMenu)}
              aria-label="User menu"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarInitial}>{getInitial(user.name)}</span>
              )}
              <span className={styles.userName}>{user.name?.split(" ")[0]}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showMenu && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownName}>{user.name}</span>
                  <span className={styles.dropdownEmail}>{user.email}</span>
                </div>
                <div className={styles.dropdownDivider} />
                <Link href="/settings" className={styles.dropdownItem} onClick={() => setShowMenu(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </Link>
                <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={handleLogout}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary" style={{ padding: "8px 18px", fontSize: "0.8rem" }}>
            Sign In
          </Link>
        )}
      </div>

      {showMenu && (
        <div className={styles.overlay} onClick={() => setShowMenu(false)} />
      )}
    </nav>
  );
}
