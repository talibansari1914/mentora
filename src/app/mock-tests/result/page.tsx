"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line
} from "recharts";
import { Award, Target, Clock, Zap, RotateCcw, FileText, CheckCircle2 } from "lucide-react";
import { testService } from "@/services/testService";
import { gradAmberDeep } from "@/lib/theme";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import type { ChartTooltipProps } from "@/types/chart";

// ── Theme / Style Constants ──
// Surface/text tokens now point at the shared --theme-* CSS variables set on
// <html data-theme="dark|light">, so this page mirrors the dashboard toggle
// exactly. Chart series colors (purple/pink/yellow/blue) stay fixed on
// purpose — they encode "Correct / Wrong / Skipped / Pace" consistently
// across both themes, the same way a chart legend shouldn't change meaning
// when you flip dark mode.
const theme = {
  bg: "var(--theme-bg-main)",
  cardBg: "var(--theme-card-bg)",
  border: "1px solid var(--theme-border)",
  textMain: "var(--theme-text-main)",
  textMuted: "var(--theme-text-sub)",
  green: "#10B981",
  red: "#EF4444",
  accentPurple: "#7C3AED",
  accentBlue: "#0284C7",
  accentPink: "#DB2777",
  accentOrange: "var(--theme-accent)",
  accentYellow: "#CA8A04",
  barMuted: "var(--theme-hover-bg)"
};

const G = {
  card: { 
    background: theme.cardBg, 
    border: theme.border, 
    borderRadius: "20px", 
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
  },
  grad: gradAmberDeep
};

// ── Types ──────────────────────────────────────────────────────────────────
type SubjectBreakdown = {
  subject: string;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  attempted: number;
};

type StoredResult = {
  title: string;
  exam: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  timeUsed: number;
  subjectBreakdown: SubjectBreakdown[];
};

// ── Data Fetching ──
function getLatestFromStorage(): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mentora_test_results");
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
  } catch {
    return null;
  }
}

// ── Custom Tooltip Components ──
const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: theme.cardBg, border: theme.border, padding: "12px 16px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <p style={{ color: theme.textMuted, fontSize: "0.8rem", marginBottom: "8px", fontWeight: 600 }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: entry.color }} />
            <span style={{ color: theme.textMain, fontSize: "0.9rem", fontWeight: 700 }}>{entry.value}</span>
            <span style={{ color: theme.textMuted, fontSize: "0.8rem" }}>{entry.name}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Main Content ───────────────────────────────────────────────────────────
function ResultContent() {
  const params = useSearchParams();
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const resultId = params.get("id");
    let cancelled = false;

    (async () => {
      if (resultId) {
        try {
          const remote = await testService.getResult(resultId);
          if (cancelled) return;
          setStored({
            title: remote.title,
            exam: remote.exam,
            score: remote.score,
            total: remote.total,
            correct: remote.correct,
            wrong: remote.wrong,
            skipped: remote.skipped,
            accuracy: remote.accuracy,
            timeUsed: remote.time_used,
            subjectBreakdown: Object.entries(remote.subject_breakdown ?? {}).map(([subject, s]) => ({
              subject,
              correct: s.correct,
              wrong: s.wrong,
              skipped: s.skipped,
              accuracy: s.accuracy,
              attempted: s.correct + s.wrong,
            })),
          });
          setLoaded(true);
          return;
        } catch (err) {
          // Fall through to localStorage below — e.g. the Supabase save at
          // submission time failed, or this is an old bookmarked link.
          console.error("Could not load result from Supabase, falling back to local copy:", err);
        }
      }

      if (cancelled) return;

      setStored(getLatestFromStorage());
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  const correct  = stored?.correct  ?? parseInt(params.get("correct")  || "0");
  const wrong    = stored?.wrong    ?? parseInt(params.get("wrong")    || "0");
  const skipped  = stored?.skipped  ?? parseInt(params.get("skipped")  || "0");
  const score    = stored?.score    ?? parseInt(params.get("score")    || "0");
  const total    = stored?.total    ?? parseInt(params.get("total")    || "40");
  const timeUsed = stored?.timeUsed ?? parseInt(params.get("timeUsed") || "0");
  const testTitle = stored?.title   ?? params.get("title") ?? "Mock Test Analysis";
  
  const totalQuestions = correct + wrong + skipped;
  const accuracy   = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const percentile = Math.min(99, Math.round((score / (total || 1)) * 100 * 0.95 + 4));
  const pacePerQ   = totalQuestions > 0 ? Math.round(timeUsed / totalQuestions) : 0;

  const rawBreakdown: SubjectBreakdown[] = stored?.subjectBreakdown ?? [];
  const breakdown = rawBreakdown.map(s => ({
    ...s,
    attempted: s.correct + s.wrong,
    score: (s.correct * 4) - (s.wrong * 1)
  }));

  const pieData = [
    { name: "Correct", value: correct, color: theme.accentPurple },
    { name: "Wrong",   value: wrong,   color: theme.accentPink },
    { name: "Skipped", value: skipped, color: theme.accentYellow },
  ];

  const highestScoreIdx = breakdown.length > 0 
    ? breakdown.reduce((maxIdx, curr, idx, arr) => curr.score > arr[maxIdx].score ? idx : maxIdx, 0)
    : -1;

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
      ⏳ Loading Dashboard...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMain, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Header Navigation Bar ── */}
      <header style={{ background: theme.cardBg, borderBottom: theme.border, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <BackToDashboardLink href="/mock-tests" label="Back to Mock Tests" inline />
          <span style={{ color: "var(--theme-border)" }}>|</span>
          <span style={{ fontSize: "0.85rem", color: theme.textMuted, fontWeight: 600 }}>{testTitle}</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/mock-tests" style={{ padding: "8px 16px", borderRadius: "10px", border: theme.border, background: theme.cardBg, color: theme.textMain, fontWeight: 700, fontSize: "0.85rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            <RotateCcw size={14} /> Retake Test
          </Link>
        </div>
      </header>

      {/* ── Dashboard Content ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px", boxSizing: "border-box" }} className="dashboard-container">
        
        {/* Title Row */}
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.8rem)", fontWeight: 800, color: theme.textMain, letterSpacing: "-0.02em" }}>Performance Analytics</h1>
            <p style={{ fontSize: "0.9rem", color: theme.textMuted, marginTop: "4px" }}>Here is the detailed breakdown of your submission and accuracy stats.</p>
          </div>
          <div style={{ background: "var(--theme-accent-soft)", border: "1px solid var(--theme-accent-border)", padding: "8px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} color="var(--theme-accent)" />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--theme-accent)" }}>Successfully Evaluated</span>
          </div>
        </div>

        {/* ── Main Bento Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }} className="bento-grid">
          
          {/* TOP LEFT: 2x2 KPI Grid (Spans 5 cols) */}
          <div style={{ gridColumn: "span 5", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="kpi-grid">
            
            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem", fontWeight: 600 }}>Total Score</span>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={16} color={theme.accentPurple} />
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "12px 0 4px", color: theme.textMain }}>{score} <span style={{ fontSize: "1rem", color: theme.textMuted, fontWeight: 500 }}>/ {total}</span></h2>
                <p style={{ color: theme.green, fontSize: "0.78rem", fontWeight: 700 }}>↗ Great Attempt</p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem", fontWeight: 600 }}>Percentile</span>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--theme-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Award size={16} color="var(--theme-accent)" />
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "12px 0 4px", color: theme.textMain }}>{percentile}%</h2>
                <p style={{ color: theme.green, fontSize: "0.78rem", fontWeight: 700 }}>↗ Top {100 - percentile}% students</p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem", fontWeight: 600 }}>Accuracy</span>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Target size={16} color={theme.green} />
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "12px 0 4px", color: theme.textMain }}>{accuracy}%</h2>
                <p style={{ color: accuracy >= 70 ? theme.green : theme.red, fontSize: "0.78rem", fontWeight: 700 }}>
                  {accuracy >= 70 ? "↗ High Precision" : "↘ Needs Focus"}
                </p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem", fontWeight: 600 }}>Avg Pace</span>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(2,132,199,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={16} color={theme.accentBlue} />
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "12px 0 4px", color: theme.textMain }}>{pacePerQ}s</h2>
                <p style={{ color: theme.textMuted, fontSize: "0.78rem", fontWeight: 600 }}>Per question avg</p>
              </div>
            </div>

          </div>

          {/* TOP RIGHT: Bar Chart (Spans 7 cols) */}
          <div style={{ ...G.card, gridColumn: "span 7", display: "flex", flexDirection: "column" }} className="chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ color: theme.textMain, fontSize: "1rem", fontWeight: 800 }}>Subject Performance Score</span>
              <span style={{ border: theme.border, padding: "6px 12px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600, color: theme.textMuted }}>Weighted 4/-1</span>
            </div>
            <div style={{ flex: 1, minHeight: "220px" }}>
              {breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdown} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "transparent" }} content={<CustomTooltip />} />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={32}>
                      {breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === highestScoreIdx ? theme.accentPurple : theme.barMuted} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted, fontWeight: 600 }}>No subject data available</div>
              )}
            </div>
          </div>

          {/* BOTTOM LEFT: Line Chart (Spans 7 cols) */}
          <div style={{ ...G.card, gridColumn: "span 7", display: "flex", flexDirection: "column" }} className="chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ color: theme.textMain, fontSize: "1rem", fontWeight: 800 }}>Attempt Distribution Trend</span>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", fontWeight: 700, flexWrap: "wrap" }}>
                <span style={{ color: theme.accentPurple }}>● Correct</span>
                <span style={{ color: theme.accentPink }}>● Wrong</span>
                <span style={{ color: theme.accentYellow }}>● Skipped</span>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: "220px" }}>
              {breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" name="Correct" dataKey="correct" stroke={theme.accentPurple} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "var(--theme-card-bg)", stroke: theme.accentPurple, strokeWidth: 2 }} />
                    <Line type="monotone" name="Wrong" dataKey="wrong" stroke={theme.accentPink} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "var(--theme-card-bg)", stroke: theme.accentPink, strokeWidth: 2 }} />
                    <Line type="monotone" name="Skipped" dataKey="skipped" stroke={theme.accentYellow} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "var(--theme-card-bg)", stroke: theme.accentYellow, strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted, fontWeight: 600 }}>No trend data</div>
              )}
            </div>
          </div>

          {/* BOTTOM RIGHT: Donut Chart (Spans 5 cols) */}
          <div style={{ ...G.card, gridColumn: "span 5", display: "flex", flexDirection: "column" }} className="chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
              <span style={{ color: theme.textMain, fontSize: "1rem", fontWeight: 800 }}>Accuracy Breakdown</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, position: "relative", flexWrap: "wrap", gap: "16px" }}>
              
              {/* Left Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <p style={{ color: theme.textMain, fontSize: "1rem", fontWeight: 800 }}>{accuracy}%</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.75rem", fontWeight: 600 }}>Accuracy Rate</p>
                </div>
                <div>
                  <p style={{ color: theme.textMain, fontSize: "1rem", fontWeight: 800 }}>{totalQuestions > 0 ? Math.round(((wrong + skipped)/totalQuestions)*100) : 0}%</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.75rem", fontWeight: 600 }}>Error / Skip Rate</p>
                </div>
              </div>

              {/* Chart */}
              <div style={{ width: "180px", height: "180px", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <p style={{ color: theme.textMain, fontSize: "1.2rem", fontWeight: 800 }}>{totalQuestions}</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem", fontWeight: 600 }}>Total Qs</p>
                </div>
              </div>

              {/* Right Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "right" }}>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.72rem", fontWeight: 700 }}><span style={{ color: theme.accentPurple }}>●</span> Correct</p>
                  <p style={{ color: theme.textMain, fontSize: "0.9rem", fontWeight: 800 }}>{correct}</p>
                </div>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.72rem", fontWeight: 700 }}><span style={{ color: theme.accentPink }}>●</span> Wrong</p>
                  <p style={{ color: theme.textMain, fontSize: "0.9rem", fontWeight: 800 }}>{wrong}</p>
                </div>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.72rem", fontWeight: 700 }}><span style={{ color: theme.accentYellow }}>●</span> Skipped</p>
                  <p style={{ color: theme.textMain, fontSize: "0.9rem", fontWeight: 800 }}>{skipped}</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
      
      {/* ── Responsive CSS Grid Media Queries ── */}
      <style jsx global>{`
        @media(max-width: 1024px) {
          .bento-grid > div {
            grid-column: span 12 !important;
          }
          .kpi-grid {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>Loading Result Engine...</div>}>
      <ResultContent />
    </Suspense>
  );
}