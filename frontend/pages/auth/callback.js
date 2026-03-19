import { useEffect } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

// Handles /auth/callback?token=...&user=...
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { token, user, error } = router.query;

    if (error) {
      toast.error(decodeURIComponent(error));
      router.replace("/login");
      return;
    }

    if (token && user) {
      try {
        localStorage.setItem("antoniqueee_token", token);
        localStorage.setItem("antoniqueee_user", decodeURIComponent(user));
        toast.success("Logged in with Google!");
        router.replace("/");
      } catch {
        toast.error("Authentication failed.");
        router.replace("/login");
      }
    }
  }, [router.query]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "var(--bg-primary)",
      flexDirection: "column",
      gap: "16px",
    }}>
      <div style={{ color: "var(--accent)", fontSize: "2rem", animation: "spin 1s linear infinite" }}>✦</div>
      <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.9rem" }}>
        Completing sign-in...
      </p>
    </div>
  );
}
