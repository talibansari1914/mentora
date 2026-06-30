"use client";
import { useState } from "react";
import Link from "next/link";

const G = {
  grad: "linear-gradient(120deg,#F59E0B,#F97316)",
};

const EXAMS = ["UPSC","JEE","NEET","SSC","Banking","Engineering"];
const EXAM_ICONS: Record<string,string> = { UPSC:"🏛️", JEE:"⚗️", NEET:"🔬", SSC:"📋", Banking:"🏦", Engineering:"⚙️" };

function PwStrength({ pw }: { pw: string }) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { pct: "0%", color: "transparent", text: "" },
    { pct: "25%", color: "#EF4444", text: "Weak" },
    { pct: "50%", color: "#F59E0B", text: "Fair" },
    { pct: "75%", color: "#3B82F6", text: "Good" },
    { pct: "100%", color: "#22C55E", text: "Strong ✓" },
  ];
  const l = levels[Math.min(score, 4)];
  if (!pw) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
      <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: l.pct, background: l.color, borderRadius: "2px", transition: "all 0.3s" }} />
      </div>
      <span style={{ fontSize: "0.7rem", color: l.color, fontFamily: "monospace", whiteSpace: "nowrap" }}>{l.text}</span>
    </div>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [selectedExam, setSelectedExam] = useState("");
  const [shake, setShake] = useState(false);

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const goStep2 = () => {
    if (!fname || !lname || !email || password.length < 8) { doShake(); return; }
    setStep(2);
  };
  const goStep3 = () => {
    if (!selectedExam) { doShake(); return; }
    setStep(3);
  };

  const inputStyle = (focused = false) => ({
    width: "100%", padding: "12px 14px", background: "#111827",
    border: `1px solid ${focused ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: "12px", color: "white", fontSize: "0.9rem",
    outline: "none", fontFamily: "'DM Sans',sans-serif",
    boxSizing: "border-box" as const, transition: "border 0.2s",
  });

  const PERKS = [
    { title: "Free forever plan", sub: "50 books + 5 mock tests every month" },
    { title: "AI Doubt Solver", sub: "Get answers to any question instantly" },
    { title: "Progress tracking", sub: "See your rank improve week by week" },
    { title: "No credit card needed", sub: "Start free, upgrade when ready" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: "'DM Sans',sans-serif", background: "#080C14", color: "white" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ position: "relative", background: "#0D1220", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "48px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(ellipse 80% 70% at 30% 40%,black 0%,transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 30% 40%,black 0%,transparent 100%)" }} />
        <div style={{ position: "absolute", top: "-100px", left: "-80px", width: "420px", height: "420px", background: "radial-gradient(ellipse,rgba(245,158,11,0.1) 0%,transparent 65%)", filter: "blur(40px)", pointerEvents: "none" }} />

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", position: "relative", zIndex: 2, marginBottom: "48px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "bold", boxShadow: "0 3px 14px rgba(245,158,11,0.4)" }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.02em" }}>Mentor<span style={{ color: "#F59E0B" }}>a</span></span>
        </Link>

        <div style={{ position: "relative", zIndex: 2, borderLeft: "2px solid #F59E0B", paddingLeft: "20px", marginBottom: "40px" }}>
          <p style={{ fontSize: "1.05rem", fontStyle: "italic", color: "#CBD5E1", lineHeight: 1.65, marginBottom: "12px" }}>
            "The secret of getting ahead is getting started. Start now, not tomorrow."
          </p>
          <p style={{ fontSize: "0.78rem", color: "#64748B", fontFamily: "monospace" }}>— Mark Twain</p>
        </div>

        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "18px", marginBottom: "40px" }}>
          {PERKS.map(p => (
            <div key={p.title} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ color: "#F59E0B", fontSize: "0.7rem", marginTop: "4px", flexShrink: 0 }}>✦</span>
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#F8FAFC", marginBottom: "2px" }}>{p.title}</p>
                <p style={{ fontSize: "0.78rem", color: "#64748B" }}>{p.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 2, marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { icon: "🆕", name: "Vikram J. just joined from Bhopal", time: "Just now" },
            { icon: "📚", name: "Sneha R. downloaded UPSC notes", time: "3 min ago" },
          ].map((a, i) => (
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
        <div style={{ width: "100%", maxWidth: "420px", animation: shake ? "shake 0.4s ease" : "none" }}>

          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "8px" }}>Create your account</h1>
            <p style={{ color: "#64748B", fontSize: "0.9rem" }}>Free forever. No credit card required.</p>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
            {[1,2,3].map((n, i) => (
              <div key={n} style={{ display: "contents" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0, transition: "all 0.3s",
                  background: step > n ? "#22C55E" : step === n ? G.grad : "#111827",
                  border: step > n ? "none" : step === n ? "none" : "1.5px solid rgba(255,255,255,0.12)",
                  color: step > n ? "white" : step === n ? "#080C14" : "#64748B",
                  boxShadow: step === n ? "0 0 12px rgba(245,158,11,0.4)" : "none",
                }}>
                  {step > n ? "✓" : n}
                </div>
                {i < 2 && <div style={{ flex: 1, height: "1.5px", background: step > n ? "#22C55E" : "rgba(255,255,255,0.07)", transition: "background 0.3s" }} />}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
            {["Your Info", "Exam Goal", "Done"].map((l, i) => (
              <span key={l} style={{ fontSize: "0.72rem", fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? "#F59E0B" : "#64748B", flex: 1, textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>{l}</span>
            ))}
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              <button style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#CBD5E1", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", marginBottom: "20px", fontFamily: "'DM Sans',sans-serif" }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              <div style={{ position: "relative", textAlign: "center", margin: "20px 0" }}>
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.07)" }} />
                <span style={{ position: "relative", background: "#080C14", padding: "0 14px", fontSize: "0.75rem", color: "#64748B" }}>or with email</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "7px" }}>First name</label>
                  <input value={fname} onChange={e => setFname(e.target.value)} placeholder="Rahul" style={inputStyle()}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(245,158,11,0.5)"}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "7px" }}>Last name</label>
                  <input value={lname} onChange={e => setLname(e.target.value)} placeholder="Kumar" style={inputStyle()}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(245,158,11,0.5)"}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"} />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "7px" }}>Email address</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem", pointerEvents: "none" }}>✉</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    style={{ ...inputStyle(), paddingLeft: "40px" }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(245,158,11,0.5)"}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"} />
                </div>
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "7px" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem", pointerEvents: "none" }}>🔒</span>
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters"
                    style={{ ...inputStyle(), paddingLeft: "40px", paddingRight: "44px" }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(245,158,11,0.5)"}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#64748B" }}>
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
                <PwStrength pw={password} />
              </div>

              <button onClick={goStep2} style={{ width: "100%", padding: "13px", background: G.grad, border: "none", borderRadius: "12px", color: "#080C14", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 18px rgba(245,158,11,0.35)" }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "16px" }}>Which exam are you preparing for?</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "24px" }}>
                {EXAMS.map(ex => (
                  <div key={ex} onClick={() => setSelectedExam(ex)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "16px 8px", background: selectedExam === ex ? "rgba(245,158,11,0.1)" : "#111827", border: selectedExam === ex ? "1.5px solid #F59E0B" : "1.5px solid rgba(255,255,255,0.08)", borderRadius: "12px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: selectedExam === ex ? "#F59E0B" : "#64748B", transition: "all 0.2s", boxShadow: selectedExam === ex ? "0 0 0 3px rgba(245,158,11,0.1)" : "none" }}>
                    <span style={{ fontSize: "1.5rem" }}>{EXAM_ICONS[ex]}</span>
                    {ex}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setStep(1)} style={{ padding: "13px 20px", background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#64748B", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>
                <button onClick={goStep3} disabled={!selectedExam} style={{ flex: 1, padding: "13px", background: selectedExam ? G.grad : "#111827", border: "none", borderRadius: "12px", color: selectedExam ? "#080C14" : "#64748B", fontSize: "0.95rem", fontWeight: 700, cursor: selectedExam ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif", boxShadow: selectedExam ? "0 4px 18px rgba(245,158,11,0.35)" : "none" }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "4rem", marginBottom: "20px", display: "block", animation: "bounce 0.6s ease" }}>🎉</div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", background: G.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "12px" }}>You&apos;re in!</h2>
              <p style={{ fontSize: "0.9rem", color: "#64748B", lineHeight: 1.6, marginBottom: "28px" }}>
                Your Mentora account is ready. Start exploring your personalized dashboard.
              </p>
              <Link href="/dashboard" style={{ display: "block", textAlign: "center", padding: "14px", background: G.grad, borderRadius: "12px", color: "#080C14", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", boxShadow: "0 4px 18px rgba(245,158,11,0.35)" }}>
                Go to Dashboard →
              </Link>
            </div>
          )}

          {step < 3 && (
            <p style={{ textAlign: "center", marginTop: "22px", fontSize: "0.85rem", color: "#64748B" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#F59E0B", fontWeight: 600, textDecoration: "none" }}>Log in →</Link>
            </p>
          )}
          <p style={{ textAlign: "center", marginTop: "14px", fontSize: "0.75rem", color: "#334155", lineHeight: 1.5 }}>
            By signing up, you agree to our{" "}
            <Link href="#" style={{ color: "#64748B", textDecoration: "none" }}>Terms</Link>{" "}and{" "}
            <Link href="#" style={{ color: "#64748B", textDecoration: "none" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        @keyframes bounce{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
        @media(max-width:768px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}div[style*="borderRight"]{display:none!important}}
      `}</style>
    </div>
  );
}
