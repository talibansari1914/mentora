"use client";
import { useState } from "react";
import Link from "next/link";

const G = {
  grad: "linear-gradient(120deg,#F59E0B,#F97316)",
  gradText: { background: "linear-gradient(120deg,#F59E0B,#F97316)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { window.location.href = "/dashboard"; }, 1400);
  };

  const ACTIVITY = [
    { icon: "🏆", name: "Priya S. cleared UPSC Prelims", time: "2 hours ago" },
    { icon: "📈", name: "Rahul K. scored 94/100 in JEE Mock", time: "5 hours ago" },
    { icon: "🎯", name: "Ananya M. completed 30-day streak", time: "Just now" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: "'DM Sans',sans-serif", background: "#080C14", color: "white" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ position: "relative", background: "#0D1220", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "48px", overflow: "hidden" }}>
        {/* Grid bg */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(ellipse 80% 70% at 30% 40%,black 0%,transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 30% 40%,black 0%,transparent 100%)" }} />
        {/* Glow */}
        <div style={{ position: "absolute", top: "-100px", left: "-80px", width: "420px", height: "420px", background: "radial-gradient(ellipse,rgba(245,158,11,0.1) 0%,transparent 65%)", filter: "blur(40px)", pointerEvents: "none" }} />

        {/* Logo */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", position: "relative", zIndex: 2, marginBottom: "48px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "bold", boxShadow: "0 3px 14px rgba(245,158,11,0.4)" }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.02em" }}>Mentor<span style={{ color: "#F59E0B" }}>a</span></span>
        </Link>

        {/* Quote */}
        <div style={{ position: "relative", zIndex: 2, borderLeft: "2px solid #F59E0B", paddingLeft: "20px", marginBottom: "48px" }}>
          <p style={{ fontSize: "1.05rem", fontStyle: "italic", color: "#CBD5E1", lineHeight: 1.65, marginBottom: "12px" }}>
            "Success is the sum of small efforts, repeated day in and day out."
          </p>
          <p style={{ fontSize: "0.78rem", color: "#64748B", fontFamily: "monospace" }}>— Robert Collier</p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "32px", marginBottom: "48px", position: "relative", zIndex: 2 }}>
          {[{ val: "50K+", lbl: "Students" }, { val: "10K+", lbl: "Materials" }, { val: "500+", lbl: "Mock Tests" }].map(s => (
            <div key={s.lbl}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", background: G.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: "3px" }}>{s.val}</div>
              <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <div style={{ position: "relative", zIndex: 2, marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px 14px" }}>
              <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{a.icon}</span>
              <div>
                <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#CBD5E1", marginBottom: "2px" }}>{a.name}</p>
                <p style={{ fontSize: "0.7rem", color: "#64748B", fontFamily: "monospace" }}>{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "8px" }}>Welcome back</h1>
            <p style={{ color: "#64748B", fontSize: "0.9rem" }}>Log in to continue your preparation</p>
          </div>

          {/* Google */}
          <button style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#CBD5E1", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", marginBottom: "20px", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.background = "#1A2336"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.background = "#111827"; }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ position: "relative", textAlign: "center", margin: "20px 0" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.07)" }} />
            <span style={{ position: "relative", background: "#080C14", padding: "0 14px", fontSize: "0.75rem", color: "#64748B" }}>or continue with email</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "7px" }}>Email address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem", pointerEvents: "none" }}>✉</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  style={{ width: "100%", padding: "12px 14px 12px 40px", background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "white", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" as const, transition: "border 0.2s" }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(245,158,11,0.5)"}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#CBD5E1" }}>Password</label>
                <Link href="#" style={{ fontSize: "0.8rem", color: "#F59E0B", textDecoration: "none", fontWeight: 500 }}>Forgot password?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem", pointerEvents: "none" }}>🔒</span>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required
                  style={{ width: "100%", padding: "12px 44px 12px 40px", background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "white", fontSize: "0.9rem", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" as const, transition: "border 0.2s" }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(245,158,11,0.5)"}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#64748B" }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.84rem", color: "#64748B" }}>
              <div onClick={() => setRemember(!remember)} style={{ width: "18px", height: "18px", borderRadius: "4px", border: remember ? "none" : "1.5px solid rgba(255,255,255,0.15)", background: remember ? G.grad : "#111827", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: "0.7rem", color: "white" }}>
                {remember ? "✓" : ""}
              </div>
              Remember me for 30 days
            </label>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: G.grad, border: "none", borderRadius: "12px", color: "#080C14", fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 18px rgba(245,158,11,0.35)", transition: "all 0.2s" }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(245,158,11,0.5)"; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(245,158,11,0.35)"; }}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "22px", fontSize: "0.85rem", color: "#64748B" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "#F59E0B", fontWeight: 600, textDecoration: "none" }}>Create one free →</Link>
          </p>
          <p style={{ textAlign: "center", marginTop: "14px", fontSize: "0.75rem", color: "#334155", lineHeight: 1.5 }}>
            By logging in, you agree to our{" "}
            <Link href="#" style={{ color: "#64748B", textDecoration: "none" }}>Terms</Link>{" "}and{" "}
            <Link href="#" style={{ color: "#64748B", textDecoration: "none" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media(max-width:768px){
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
          div[style*="borderRight"]{display:none!important}
        }
      `}</style>
    </div>
  );
}
