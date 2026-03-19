import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { getMe, updateSettings, logout, isAuthenticated } from "../services/api";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    theme: "dark",
    notifications: true,
    language: "en",
    fontSize: "medium",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const u = await getMe();
      setUser(u);
      if (u.settings) setSettings({ ...settings, ...u.settings });
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      // Apply theme
      document.documentElement.setAttribute("data-theme", settings.theme);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className={styles.toggleThumb} />
    </button>
  );

  return (
    <div className={styles.page} data-theme="dark">
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Customize your Antoniqueee AI experience</p>
          </div>

          {/* Profile Section */}
          {user && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Profile</h2>
              <div className={styles.profileCard}>
                <div className={styles.avatar}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <span>{user.name?.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>{user.name}</p>
                  <p className={styles.profileEmail}>{user.email}</p>
                  <div className={styles.profileBadges}>
                    {user.googleId && (
                      <span className={styles.badge}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#4285F4">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google Connected
                      </span>
                    )}
                    <span className={`${styles.badge} ${styles.badgeRole}`}>
                      {user.role === "admin" ? "⚡ Admin" : "👤 User"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Appearance</h2>

            <div className={styles.settingRow}>
              <div>
                <p className={styles.settingName}>Theme</p>
                <p className={styles.settingDesc}>Choose your preferred color scheme</p>
              </div>
              <div className={styles.themeOptions}>
                {["dark", "light", "auto"].map((t) => (
                  <button
                    key={t}
                    className={`${styles.themeBtn} ${settings.theme === t ? styles.themeBtnActive : ""}`}
                    onClick={() => setSettings({ ...settings, theme: t })}
                  >
                    {t === "dark" ? "🌙" : t === "light" ? "☀️" : "🌓"}
                    <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.settingRow}>
              <div>
                <p className={styles.settingName}>Font Size</p>
                <p className={styles.settingDesc}>Adjust the text size in chat</p>
              </div>
              <select
                className={styles.select}
                value={settings.fontSize}
                onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>

          {/* Notifications */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Notifications</h2>
            <div className={styles.settingRow}>
              <div>
                <p className={styles.settingName}>Push Notifications</p>
                <p className={styles.settingDesc}>Receive alerts when AI responds</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications}
                onChange={(v) => setSettings({ ...settings, notifications: v })}
              />
            </div>
          </div>

          {/* Language */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Language & Region</h2>
            <div className={styles.settingRow}>
              <div>
                <p className={styles.settingName}>Interface Language</p>
                <p className={styles.settingDesc}>Language for the UI</p>
              </div>
              <select
                className={styles.select}
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>

          {/* Save */}
          <div className={styles.saveRow}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>

          {/* Danger zone */}
          <div className={`${styles.section} ${styles.dangerSection}`}>
            <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Danger Zone</h2>
            <div className={styles.settingRow}>
              <div>
                <p className={styles.settingName}>Sign Out</p>
                <p className={styles.settingDesc}>Log out of your account on this device</p>
              </div>
              <button className="btn btn-danger" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
