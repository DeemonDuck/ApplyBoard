import { supabase } from "../supabase";

export default function LoginPage() {
  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", gap: "var(--space-4)",
    }}>
      <h1 style={{ fontSize: "28px" }}>Job Tracker</h1>
      <p style={{ color: "var(--paper-dim)", fontSize: "14px" }}>
        Every application, every platform, one ledger.
      </p>
      <button
        onClick={handleGoogleLogin}
        style={{
          background: "var(--status-interview)",
          color: "var(--ink)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          padding: "12px 24px",
          fontWeight: 600,
          fontSize: "15px",
          cursor: "pointer",
          marginTop: "var(--space-4)",
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
