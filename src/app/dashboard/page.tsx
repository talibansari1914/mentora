"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getTestResults, TestResult } from "@/lib/questionBank";

const G = {
  grad: "linear-gradient(120deg,#F59E0B,#F97316)",
  gradText: { background: "linear-gradient(120deg,#F59E0B,#F97316)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const },
  card: { background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px" },
};

// ══════════════════════════════════════════
// 👇 SAB DUMMY DATA YAHAN HAI — Yahan se edit karo
// Baad mein yeh sab backend/database se aayega
// ══════════════════════════════════════════
const USER = {
  name: "Rahul Singh",
  firstName: "Rahul",
  initials: "RS",
  plan: "Free Plan",
  exam: "UPSC",
  streak: 7,
};

const STATS = {
  booksRead: 24,
  booksChange: "+3 this week",
  testsAttempted: 18,
  testsChange: "+5 this week",
  accuracy: 74,
  accuracyChange: "↑ 6% from last week",
  studyHours: 42,
  studyHoursNote: "This month",
};

const RANK = {
  national: "1,247",
  percentile: "Top 3%",
  state: "MP",
  stateRank: "143",
  city: "Bhopal",
  cityRank: "28",
};

const STREAK_DAYS = [
  { day: "M", done: true },
  { day: "T", done: true },
  { day: "W", done: true },
  { day: "T", done: true },
  { day: "F", done: true },
  { day: "S", done: true },
  { day: "S", done: false, today: true },
];
// ══════════════════════════════════════════

const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", href: "/dashboard", active: true },
  { icon: "📚", label: "Library", href: "/library", badge: "New" },
  { icon: "📝", label: "Mock Tests", href: "/mock-tests" },
  { icon: "🗂️", label: "PYQs", href: "/pyqs" },
  { icon: "📓", label: "My Notes", href: "/my-notes" },
];

const AI_ITEMS = [
  { icon: "🤖", label: "AI Tutor", href: "#", pro: true },
  { icon: "🎧", label: "Audio Notes", href: "#", pro: true },
];

const PLAN_ITEMS = [
  { icon: "🗓️", label: "Study Planner", href: "/planner" },
  { icon: "📊", label: "Analytics", href: "/analytics" },
];

const TASKS = [
  { title: "Modern History — Chapter 5", meta: "45 min · Completed", tag: "UPSC", done: true },
  { title: "Polity Mock Test — Set 3", meta: "30 min · Pending", tag: "UPSC", done: false },
  { title: "Geography — Physical Features", meta: "60 min · Pending", tag: "UPSC", done: false },
  { title: "Economy PYQs — 2020-23", meta: "20 min · Pending", tag: "PYQ", done: false },
];

const BOOKS = [
  { title: "Indian Polity — Laxmikanth", sub: "UPSC · Chapter 12 of 34", pct: 35, color: "linear-gradient(135deg,#6366F1,#8B5CF6)" },
  { title: "Economy by Ramesh Singh", sub: "UPSC · Chapter 6 of 20", pct: 30, color: "linear-gradient(135deg,#F59E0B,#EF4444)" },
  { title: "Geography — Majid Husain", sub: "UPSC · Chapter 3 of 18", pct: 17, color: "linear-gradient(135deg,#06B6D4,#3B82F6)" },
];

const WEAK = [
  { topic: "Environment & Ecology", pct: 42, level: "low" },
  { topic: "Science & Technology", pct: 58, level: "mid" },
  { topic: "International Relations", pct: 63, level: "mid" },
  { topic: "Indian Economy", pct: 71, level: "high" },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const scoreColor = (level: string) => level === "high" ? "#22C55E" : level === "mid" ? "#F59E0B" : "#EF4444";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentTests, setRecentTests] = useState<TestResult[]>([]);

  // Load real test results saved by the Mock Test flow (localStorage demo "database")
  useEffect(() => {
    setRecentTests(getTestResults().slice(0, 3));
  }, []);

  const NavSection = ({ label, items }: { label: string; items: typeof NAV_ITEMS }) => (
    <div style={{ marginBottom: "8px" }}>
      <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#334155", padding: "0 12px", marginBottom: "4px" }}>{label}</p>
      {items.map(item => (
        <Link key={item.label} href={item.href} style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 12px", borderRadius: "10px", marginBottom: "2px",
          textDecoration: "none", fontSize: "0.875rem", fontWeight: 500,
          color: item.active ? "#F59E0B" : "#64748B",
          background: item.active ? "rgba(245,158,11,0.08)" : "transparent",
          transition: "all 0.18s", position: "relative" as const,
        }}
          onMouseEnter={e => { if (!item.active) { (e.currentTarget as HTMLElement).style.background = "#1A2640"; (e.currentTarget as HTMLElement).style.color = "#CBD5E1"; } }}
          onMouseLeave={e => { if (!item.active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#64748B"; } }}>
          {item.active && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: "3px", borderRadius: "0 2px 2px 0", background: G.grad }} />}
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
          <span style={{ flex: 1, whiteSpace: "nowrap" as const }}>{item.label}</span>
          {"badge" in item && item.badge && (
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "100px", padding: "2px 7px", flexShrink: 0 }}>{item.badge}</span>
          )}
          {"pro" in item && (item as { pro?: boolean }).pro && (
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#818CF8", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "100px", padding: "2px 7px", flexShrink: 0 }}>Pro</span>
          )}
        </Link>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif" }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        width: "260px", minHeight: "100vh", background: "#0D1220",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, zIndex: 100,
        transition: "transform 0.28s ease",
      }}>
        <div style={{ padding: "22px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold", boxShadow: "0 2px 10px rgba(245,158,11,0.38)", flexShrink: 0 }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>Mentor<span style={{ color: "#F59E0B" }}>a</span></span>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
          <NavSection label="Main" items={NAV_ITEMS} />
          <NavSection label="AI Tools" items={AI_ITEMS as typeof NAV_ITEMS} />
          <NavSection label="Planning" items={PLAN_ITEMS} />
        </nav>

        <div style={{ padding: "12px 10px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(249,115,22,0.06))", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "14px", padding: "14px" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "white", marginBottom: "3px" }}>Unlock Pro</p>
            <p style={{ fontSize: "0.72rem", color: "#64748B", marginBottom: "10px" }}>AI Tutor, unlimited tests & more</p>
            <Link href="#" style={{ display: "block", textAlign: "center", background: G.grad, color: "#080C14", fontSize: "0.75rem", fontWeight: 700, padding: "8px", borderRadius: "8px", textDecoration: "none" }}>
              Upgrade — ₹299/mo
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#080C14", flexShrink: 0 }}>
              {USER.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={USER.name}>
                {USER.name}
              </p>
              <p style={{ fontSize: "0.7rem", color: "#64748B", whiteSpace: "nowrap" }}>{USER.plan}</p>
            </div>
            <Link href="/" title="Logout" style={{ fontSize: "0.95rem", color: "#334155", textDecoration: "none", transition: "color 0.2s", flexShrink: 0 }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = "#CBD5E1"}
              onMouseLeave={e => (e.target as HTMLElement).style.color = "#334155"}>⏻</Link>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main style={{ marginLeft: "260px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,12,20,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", background: "none", border: "none", color: "#64748B", fontSize: "1.3rem", cursor: "pointer" }} className="dash-hamburger">☰</button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0D1220", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "9px 14px", flex: 1, maxWidth: "440px" }}>
              <span style={{ fontSize: "0.9rem", color: "#64748B", flexShrink: 0 }}>🔍</span>
              <input type="text" placeholder="Search books, tests, notes..." style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "white", minWidth: 0 }} />
              <kbd style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#334155", background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", padding: "2px 6px", flexShrink: 0 }}>⌘K</kbd>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "100px", padding: "5px 12px", whiteSpace: "nowrap" }}>
              <span>🔥</span>
              <span style={{ fontWeight: 800, color: "#F59E0B", fontFamily: "monospace", fontSize: "0.85rem" }}>{USER.streak}</span>
              <span style={{ color: "#64748B", fontSize: "0.78rem" }}>day streak</span>
            </div>
            <div style={{ position: "relative" }}>
              <button style={{ width: "36px", height: "36px", borderRadius: "10px", background: "none", border: "none", color: "#64748B", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🔔</button>
              <div style={{ position: "absolute", top: "6px", right: "6px", width: "7px", height: "7px", background: "#F59E0B", borderRadius: "50%", border: "1.5px solid #080C14" }} />
            </div>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#080C14", cursor: "pointer", flexShrink: 0 }}>
              {USER.initials}
            </div>
          </div>
        </header>

        <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "22px" }}>

          {/* Welcome Row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "5px" }}>
                {greeting()}, {USER.firstName} 👋
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#64748B" }}>You have {TASKS.filter(t => !t.done).length} tasks pending today. Let&apos;s get them done.</p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="#" style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 600, color: "#CBD5E1", background: "#111827", border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none" }}>
                📅 Study Planner
              </Link>
              <Link href="/mock-tests" style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700, color: "#080C14", background: G.grad, textDecoration: "none", boxShadow: "0 3px 14px rgba(245,158,11,0.32)" }}>
                ▶ Resume Study
              </Link>
            </div>
          </div>

          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
            {[
              { icon: "📚", val: String(STATS.booksRead), lbl: "Books Read", change: STATS.booksChange, pos: true, bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
              { icon: "📝", val: String(STATS.testsAttempted), lbl: "Tests Attempted", change: STATS.testsChange, pos: true, bg: "rgba(99,102,241,0.12)", color: "#818CF8" },
              { icon: "🎯", val: `${STATS.accuracy}%`, lbl: "Avg Accuracy", change: STATS.accuracyChange, pos: true, bg: "rgba(34,197,94,0.1)", color: "#22C55E" },
              { icon: "⏱️", val: `${STATS.studyHours}h`, lbl: "Study Hours", change: STATS.studyHoursNote, pos: false, bg: "rgba(6,182,212,0.1)", color: "#22D3EE" },
            ].map(k => (
              <div key={k.lbl} style={{ ...G.card, padding: "18px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", marginBottom: "12px", color: k.color }}>
                  {k.icon}
                </div>
                <div style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.03em", color: "white", lineHeight: 1, marginBottom: "4px" }}>{k.val}</div>
                <div style={{ fontSize: "0.775rem", color: "#64748B", marginBottom: "8px" }}>{k.lbl}</div>
                <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: k.pos ? "#22C55E" : "#334155" }}>{k.change}</div>
              </div>
            ))}
          </div>

          {/* Mid Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "14px" }}>
            <div style={{ ...G.card, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Today&apos;s Plan</h2>
                <Link href="#" style={{ fontSize: "0.78rem", color: "#F59E0B", textDecoration: "none" }}>See all →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                {TASKS.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "#0D1220", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", opacity: t.done ? 0.5 : 1 }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: t.done ? "none" : "1.5px solid rgba(255,255,255,0.15)", background: t.done ? G.grad : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "white", flexShrink: 0 }}>
                      {t.done ? "✓" : ""}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.86rem", fontWeight: 500, color: "#CBD5E1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</p>
                      <p style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "2px", fontFamily: "monospace" }}>{t.meta}</p>
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "100px", padding: "2px 8px", flexShrink: 0 }}>{t.tag}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748B", marginBottom: "6px" }}>
                  <span>Daily goal</span>
                  <span style={{ color: "#F59E0B", fontFamily: "monospace", fontWeight: 600 }}>{TASKS.filter(t => t.done).length} / {TASKS.length} done</span>
                </div>
                <div style={{ height: "5px", background: "#1A2640", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(TASKS.filter(t => t.done).length / TASKS.length) * 100}%`, background: G.grad, borderRadius: "3px" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ ...G.card, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Your Rank</h2>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "100px", padding: "2px 9px" }}>{USER.exam}</span>
                </div>
                <div style={{ textAlign: "center", padding: "8px 0 14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: "2px" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#F59E0B", marginTop: "6px" }}>#</span>
                    <span style={{ fontSize: "3.2rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, background: G.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{RANK.national}</span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "4px", fontFamily: "monospace" }}>National Rank · {RANK.percentile}</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[{ lbl: `State (${RANK.state})`, val: `#${RANK.stateRank}` }, { lbl: `City (${RANK.city})`, val: `#${RANK.cityRank}` }].map(r => (
                    <div key={r.lbl} style={{ flex: 1, background: "#0D1220", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px" }}>
                      <p style={{ fontSize: "0.68rem", color: "#64748B", marginBottom: "3px" }}>{r.lbl}</p>
                      <p style={{ fontSize: "1rem", fontWeight: 700, color: "white", fontFamily: "monospace" }}>{r.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...G.card, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Study Streak</h2>
                  <span style={{ fontSize: "1.3rem" }}>🔥</span>
                </div>
                <div style={{ display: "flex", gap: "6px", marginBottom: "12px", justifyContent: "space-between" }}>
                  {STREAK_DAYS.map((d, i) => (
                    <div key={i} style={{ flex: 1, aspectRatio: "1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700,
                      background: d.done ? G.grad : "#0D1220",
                      border: d.today ? "1.5px solid #F59E0B" : "none",
                      color: d.done ? "#080C14" : d.today ? "#F59E0B" : "#334155",
                      boxShadow: d.done ? "0 0 8px rgba(245,158,11,0.3)" : d.today ? "0 0 0 3px rgba(245,158,11,0.12)" : "none",
                    }}>{d.day}</div>
                  ))}
                </div>
                <p style={{ fontSize: "0.82rem", color: "#64748B" }}>{USER.streak} days strong! Keep going 💪</p>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.2fr 1fr", gap: "14px" }}>

            {/* Books */}
            <div style={{ ...G.card, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Continue Reading</h2>
                <Link href="/library" style={{ fontSize: "0.78rem", color: "#F59E0B", textDecoration: "none" }}>Library →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {BOOKS.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#0D1220", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
                    <div style={{ width: "38px", height: "48px", borderRadius: "8px", background: b.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>📖</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</p>
                      <p style={{ fontSize: "0.7rem", color: "#64748B", marginBottom: "8px" }}>{b.sub}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "4px", background: "#1A2640", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${b.pct}%`, background: G.grad, borderRadius: "2px" }} />
                        </div>
                        <span style={{ fontSize: "0.68rem", color: "#F59E0B", fontFamily: "monospace", fontWeight: 600 }}>{b.pct}%</span>
                      </div>
                    </div>
                    <button style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "#F59E0B", cursor: "pointer", flexShrink: 0 }}>▶</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tests — NOW REAL DATA from localStorage */}
            <div style={{ ...G.card, padding: "20px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Recent Test Results</h2>
                <Link href="/mock-tests" style={{ fontSize: "0.78rem", color: "#F59E0B", textDecoration: "none" }}>All Tests →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                {recentTests.length > 0 ? (
                  recentTests.map((t, i) => {
                    const scorePct = Math.round((t.score / t.total) * 100);
                    const level = scorePct >= 70 ? "high" : scorePct >= 50 ? "mid" : "low";
                    const daysAgo = Math.floor((Date.now() - new Date(t.date).getTime()) / 86400000);
                    const timeLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px", background: "#0D1220", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `rgba(${level === "high" ? "34,197,94" : level === "mid" ? "245,158,11" : "239,68,68"},0.1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, fontFamily: "monospace", color: scoreColor(level), flexShrink: 0 }}>{scorePct}%</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#CBD5E1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "3px" }}>{t.title}</p>
                          <p style={{ fontSize: "0.68rem", color: "#64748B", fontFamily: "monospace" }}>{t.score}/{t.total} · {Math.floor(t.timeUsed / 60)} min · {timeLabel}</p>
                        </div>
                        <span style={{ fontSize: "0.68rem", fontFamily: "monospace", fontWeight: 600, color: "#64748B", whiteSpace: "nowrap" }}>{t.accuracy}% acc</span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "24px 12px" }}>
                    <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "12px" }}>No tests attempted yet</p>
                    <Link href="/mock-tests" style={{ fontSize: "0.78rem", color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>Take your first test →</Link>
                  </div>
                )}
              </div>
              <Link href="/mock-tests" style={{ display: "block", textAlign: "center", marginTop: "16px", padding: "10px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, color: "#CBD5E1", textDecoration: "none" }}>
                Take New Test →
              </Link>
            </div>

            {/* Weak Topics */}
            <div style={{ ...G.card, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Focus Areas</h2>
                <span style={{ fontSize: "0.7rem", color: "#64748B", background: "#0D1220", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "100px", padding: "3px 10px" }}>🤖 AI Detected</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {WEAK.map((w, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 500 }}>{w.topic}</span>
                        <span style={{ fontSize: "0.72rem", fontFamily: "monospace", fontWeight: 600, color: scoreColor(w.level) }}>{w.pct}%</span>
                      </div>
                      <div style={{ height: "5px", background: "#1A2640", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${w.pct}%`, background: w.level === "low" ? "#EF4444" : w.level === "mid" ? G.grad : "#22C55E", borderRadius: "3px" }} />
                      </div>
                    </div>
                    <Link href="#" style={{ fontSize: "0.72rem", fontWeight: 600, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "5px 10px", textDecoration: "none", whiteSpace: "nowrap" }}>
                      Practice
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      <style>{`
        @media(max-width:900px){aside{transform:translateX(-100%)}main{margin-left:0!important}.dash-hamburger{display:flex!important}}
        @media(max-width:640px){div[style*="repeat(4,1fr)"]{grid-template-columns:1fr 1fr!important}div[style*="1.4fr 1fr"]{grid-template-columns:1fr!important}div[style*="1.3fr 1.2fr 1fr"]{grid-template-columns:1fr!important}div[style*="padding: 28px"]{padding:16px!important}}
      `}</style>
    </div>
  );
}