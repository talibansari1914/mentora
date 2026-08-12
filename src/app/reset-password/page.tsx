"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Zap, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/authService";
import { getErrorMessage } from "@/lib/errors";

export default function ResetPasswordPage() {
  const router = useRouter();

  // The recovery link (via /auth/callback) should have already signed the
  // user into a session by the time they land here. If that session isn't
  // present — e.g. they opened this page directly, or the link already
  // expired — there's nothing valid to update, so we check up front rather
  // than letting them fill out the form and only fail on submit.
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    authService
      .getCurrentUser()
      .then((user) => {
        if (!cancelled) setHasSession(!!user);
      })
      .catch(() => {
        if (!cancelled) setHasSession(false);
      })
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    background: "#161f31",
    border: "1px solid #2d3748",
    borderRadius: "14px",
    outline: "none",
    fontSize: "0.9rem",
    color: "white",
    boxSizing: "border-box",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(password);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not update your password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const shellStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5a623",
    padding: "20px",
    fontFamily: "'Inter', sans-serif",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "420px",
    background: "#0b0f17",
    borderRadius: "24px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    padding: "44px 36px",
    boxSizing: "border-box",
  };

  if (checkingSession) {
    return <div style={shellStyle} />;
  }

  if (!hasSession) {
    return (
      <div style={shellStyle}>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "white", marginBottom: "10px" }}>
            Link expired or invalid
          </h1>
          <p style={{ color: "#a0aec0", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "24px" }}>
            This password reset link is no longer valid. Reset links expire after a while for security — request a new one below.
          </p>
          <Link
            href="/forgot-password"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              background: "#f59e0b",
              borderRadius: "20px",
              color: "#111827",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={shellStyle}>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <CheckCircle2 size={40} style={{ color: "#22C55E", marginBottom: "14px" }} />
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "white", marginBottom: "10px" }}>
            Password updated
          </h1>
          <p style={{ color: "#a0aec0", fontSize: "0.88rem" }}>
            Taking you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={18} style={{ color: "#111827" }} />
          </div>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.02em", color: "white" }}>Mentora</span>
        </div>

        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, textAlign: "center", color: "white", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          Set New Password
        </h1>
        <p style={{ color: "#a0aec0", fontSize: "0.85rem", textAlign: "center", marginBottom: "24px" }}>
          Choose a new password for your account.
        </p>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", padding: "10px 12px", marginBottom: "16px", fontSize: "0.8rem", color: "#f87171" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              style={{ ...inputStyle, paddingRight: "42px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a0aec0", display: "flex", alignItems: "center" }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "13px",
              background: "#f1f5f9",
              border: "none",
              borderRadius: "20px",
              boxShadow: "5px 5px 10px rgba(0,0,0,0.2), -5px -5px 10px rgba(255,255,255,0.1)",
              color: "#1e293b",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.05em",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Lock size={16} />
            {loading ? "UPDATING..." : "UPDATE PASSWORD"}
          </button>
        </form>
      </div>
    </div>
  );
}