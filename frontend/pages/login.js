import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import { loginEmail, registerEmail, loginGoogle, isAuthenticated } from "../services/api";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.replace("/");

    // Handle OAuth callback params
    const { token, user, error } = router.query;
    if (token && user) {
      try {
        localStorage.setItem("antoniqueee_token", token);
        localStorage.setItem("antoniqueee_user", decodeURIComponent(user));
        toast.success("Logged in successfully!");
        router.replace("/");
      } catch (e) {
        toast.error("Authentication failed.");
      }
    }
    if (error) toast.error(decodeURIComponent(error));
  }, [router.query]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await loginEmail(form.email, form.password);
        toast.success("Welcome back!");
      } else {
        if (!form.name.trim()) { toast.error("Name is required"); setLoading(false); return; }
        await registerEmail(form.name, form.email, form.password);
        toast.success("Account created! Welcome!");
      }
      router.replace("/");
    } catch (err) {
      toast.error(err.error || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background decoration */}
      <div className={styles.bgGlow} />
      <div className={styles.bgGrid} />

      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>✦</div>
          <h1 className={styles.logoText}>Antoniqueee AI</h1>
          <p className={styles.logoTagline}>Your intelligent assistant, always ready.</p>
        </div>

        {/* Card */}
        <div className={styles.card}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
              onClick={() => setMode("login")}
            >
              Sign In
            </button>
            <button
              className={`${styles.tab} ${mode === "register" ? styles.tabActive : ""}`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {/* Google OAuth */}
          <button className={styles.googleBtn} onClick={loginGoogle}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className={styles.divider}>
            <span>or continue with email</span>
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input
                  className={styles.input}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Email Address</label>
              <input
                className={styles.input}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  className={styles.input}
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className={styles.showPassBtn}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          <p className={styles.switchText}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              className={styles.switchBtn}
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>
        </div>

        <p className={styles.termsText}>
          By continuing, you agree to our{" "}
          <a href="#" className={styles.termsLink}>Terms of Service</a>
          {" "}and{" "}
          <a href="#" className={styles.termsLink}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
