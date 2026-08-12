"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line
} from "recharts";
import { getLatestResult, TestResult } from "@/lib/questionBank";
import { testService } from "@/services/testService";
import type { ChartTooltipProps } from "@/types/chart";

// ── Theme / Style Constants ──
// Surface/text tokens point at the shared --theme-* CSS variables, so this
// page mirrors the dashboard's light/dark toggle exactly. The indigo/pink/
// yellow chart accents stay fixed on purpose — they're this page's chart
// series colors (Correct/Wrong/Skipped, highlighted bar), same as any other
// data-visualization legend.
const theme = {
  bg: "var(--theme-bg-main)",
  cardBg: "var(--theme-card-bg)",
  border: "1px solid var(--theme-border)",
  textMain: "var(--theme-text-main)",
  textMuted: "var(--theme-text-sub)",
  green: "#10B981",
  red: "#F43F5E",
  accentPurple: "#6366F1",
  accentPink: "#EC4899",
  accentYellow: "#EAB308",
  barMuted: "var(--theme-hover-bg)"
};

const G = {
  card: { 
    background: theme.cardBg, 
    border: theme.border, 
    borderRadius: "16px", 
    padding: "24px" 
  },
};

const EXAM_LABEL: Record<string, string> = { jee: "JEE", neet: "NEET", ups: "UPSC", ssc: "SSC" };

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: theme.cardBg, border: "1px solid var(--theme-border)", padding: "10px 14px", borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <p style={{ color: theme.textMuted, fontSize: "0.75rem", marginBottom: "6px" }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: entry.color || entry.fill }} />
            <span style={{ color: theme.textMain, fontSize: "0.85rem", fontWeight: 600 }}>{entry.value}</span>
            <span style={{ color: theme.textMuted, fontSize: "0.75rem" }}>{entry.name}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function ResultContent() {
  const params = useSearchParams();
  const [stored, setStored] = useState<TestResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const recent = await testService.getRecentResults(undefined, 1);
        if (cancelled) return;
        if (recent.length > 0) {
          const r = recent[0];
          setStored({
            testId: r.test_id, title: r.title, exam: r.exam,
            score: r.score, total: r.total, correct: r.correct,
            wrong: r.wrong, skipped: r.skipped, accuracy: r.accuracy,
            timeUsed: r.time_used, date: r.created_at ?? new Date().toISOString(),
            subjectBreakdown: Object.entries(r.subject_breakdown ?? {}).map(([subject, s]) => ({
              subject, correct: s.correct, wrong: s.wrong, skipped: s.skipped, accuracy: s.accuracy,
            })),
          });
          setLoaded(true);
          return;
        }
      } catch {
        // Not logged in, or a transient error — fall back to the local copy.
      }

      if (cancelled) return;

      try {
        const res = getLatestResult();
        if (!cancelled) setStored(res);
      } catch {
        if (!cancelled) setStored(null);
      }
      if (!cancelled) setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const correct = stored?.correct ?? parseInt(params.get("correct") || "0");
  const wrong = stored?.wrong ?? parseInt(params.get("wrong") || "0");
  const skipped = stored?.skipped ?? parseInt(params.get("skipped") || "0");
  const score = stored?.score ?? parseInt(params.get("score") || "0");
  const total = stored?.total ?? parseInt(params.get("total") || "40");
  const timeUsed = stored?.timeUsed ?? parseInt(params.get("timeUsed") || "0");
  const exam = stored?.exam ?? params.get("exam") ?? "jee";
  
  const rawBreakdown = stored?.subjectBreakdown || {};
  const subjectBreakdownArray = Array.isArray(rawBreakdown) 
    ? rawBreakdown 
    : Object.entries(rawBreakdown).map(([subject, stats]: [string, any]) => ({
        subject,
        correct: stats.correct || 0,
        wrong: stats.wrong || 0,
        skipped: stats.skipped || 0,
        total: stats.total || 0,
      }));

  const totalQuestions = correct + wrong + skipped;
  const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  
  const rawPercentile = Math.round((score / (total || 1)) * 100 * 0.95 + 4);
  const percentile = Math.max(1, Math.min(99, rawPercentile));
  
  const pacePerQ = totalQuestions > 0 ? Math.round(timeUsed / totalQuestions) : 0;

  const pieData = [
    { name: "Correct", value: correct, color: theme.green },
    { name: "Wrong", value: wrong, color: theme.red },
    { name: "Skipped", value: skipped, color: theme.textMuted },
  ];

  const chartBreakdown = subjectBreakdownArray.map(s => ({
    ...s,
    attempted: s.correct + s.wrong,
    displayScore: (s.correct * 4) - (s.wrong * 1) 
  }));

  const highestScoreIdx = chartBreakdown.length > 0 
    ? chartBreakdown.reduce((maxIdx, curr, idx, arr) => curr.displayScore > arr[maxIdx].displayScore ? idx : maxIdx, 0)
    : -1;

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading Analysis Engine...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMain, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Dashboard Content ── */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px clamp(16px, 4vw, 40px)", boxSizing: "border-box" }} className="dashboard-container">
        
        {/* Title & Navigation Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.8rem)", fontWeight: 500, color: theme.textMain }}>Test Analysis</h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/question-bank" style={{ background: "transparent", border: theme.border, color: theme.textMain, padding: "8px 14px", borderRadius: "20px", fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center" }}>
              ← Tests
            </Link>
            <Link href="/pyqs" style={{ background: "transparent", border: theme.border, color: theme.textMain, padding: "8px 14px", borderRadius: "20px", fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center" }}>
              PYQs
            </Link>
            <Link href="/question-bank" style={{ background: "transparent", border: theme.border, color: theme.textMain, padding: "8px 14px", borderRadius: "20px", fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center" }}>
              QuestionBank
            </Link>
            <Link href="/dashboard" style={{ background: theme.accentPurple, border: "none", color: "#FFFFFF", padding: "8px 18px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center" }}>
              Dashboard
            </Link>
          </div>
        </div>

        {/* ── Bento Grid Container ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }} className="bento-grid">
          
          {/* TOP LEFT: 2x2 KPI Grid (Spans 5 cols) */}
          <div style={{ gridColumn: "span 5", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="kpi-grid">
            
            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Total Score</span>
                <span style={{ color: theme.textMuted }}>📄</span>
              </div>
              <div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "14px 0 6px", color: score < 0 ? theme.red : theme.textMain }}>
                  {score} <span style={{ fontSize: "1.1rem", color: theme.textMuted }}>/ {total}</span>
                </h2>
                <p style={{ color: theme.green, fontSize: "0.75rem", fontWeight: 500 }}>{EXAM_LABEL[exam] || exam.toUpperCase()} Mock Test</p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Percentile</span>
                <span style={{ color: theme.textMuted }}>🏆</span>
              </div>
              <div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "14px 0 6px", color: theme.textMain }}>{percentile}%</h2>
                <p style={{ color: theme.textMuted, fontSize: "0.75rem", fontWeight: 500 }}>Top {100 - percentile}% of candidates</p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Accuracy</span>
                <span style={{ color: theme.textMuted }}>🎯</span>
              </div>
              <div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "14px 0 6px", color: theme.textMain }}>{accuracy}%</h2>
                <p style={{ color: accuracy >= 70 ? theme.green : theme.red, fontSize: "0.75rem", fontWeight: 500 }}>
                  {correct} correct out of {correct + wrong} attempted
                </p>
              </div>
            </div>

            <div style={{ ...G.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textMuted, fontSize: "0.85rem" }}>Avg Time/Q</span>
                <span style={{ color: theme.textMuted }}>⏱️</span>
              </div>
              <div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "14px 0 6px", color: theme.textMain }}>{pacePerQ}s</h2>
                <p style={{ color: theme.textMuted, fontSize: "0.75rem" }}>Total: {Math.floor(timeUsed / 60)}m {timeUsed % 60}s</p>
              </div>
            </div>

          </div>

          {/* TOP RIGHT: Bar Chart - Subject Performance (Spans 7 cols) */}
          <div style={{ ...G.card, gridColumn: "span 7", display: "flex", flexDirection: "column" }} className="chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ color: theme.textMain, fontSize: "0.95rem", fontWeight: 500 }}>Subject Performance Score</span>
              <span style={{ border: theme.border, padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", color: theme.textMuted }}>Bar Analytics</span>
            </div>
            <div style={{ width: "100%", height: "220px", position: "relative" }}>
              {chartBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartBreakdown} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "transparent" }} content={<CustomTooltip />} />
                    <Bar dataKey="displayScore" radius={[6, 6, 6, 6]} barSize={28}>
                      {chartBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === highestScoreIdx ? theme.accentPurple : theme.barMuted} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted }}>No subject breakdown available</div>
              )}
            </div>
          </div>

          {/* BOTTOM LEFT: Line Chart - Attempt Distribution Trend (Spans 7 cols) */}
          <div style={{ ...G.card, gridColumn: "span 7", display: "flex", flexDirection: "column" }} className="chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ color: theme.textMain, fontSize: "0.95rem", fontWeight: 500 }}>Attempt Distribution Trend</span>
            </div>
            
            <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.textMuted }}><span style={{ color: theme.green }}>●</span> Correct</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.textMuted }}><span style={{ color: theme.red }}>●</span> Wrong</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.textMuted }}><span style={{ color: theme.accentYellow }}>●</span> Skipped</div>
            </div>

            <div style={{ width: "100%", height: "200px", position: "relative" }}>
              {chartBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" name="Correct" dataKey="correct" stroke={theme.green} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" name="Wrong" dataKey="wrong" stroke={theme.red} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" name="Skipped" dataKey="skipped" stroke={theme.accentYellow} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted }}>No distribution data</div>
              )}
            </div>
          </div>

          {/* BOTTOM RIGHT: Donut Chart - Accuracy Breakdown (Spans 5 cols) */}
          <div style={{ ...G.card, gridColumn: "span 5", display: "flex", flexDirection: "column" }} className="chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: theme.textMain, fontSize: "0.95rem", fontWeight: 500 }}>Accuracy Breakdown</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", flex: 1, position: "relative", flexWrap: "wrap", gap: "16px" }}>
              
              {/* Left Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                <div>
                  <p style={{ color: theme.textMain, fontSize: "0.85rem", fontWeight: 600 }}>{accuracy}%</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}>Accuracy Rate</p>
                </div>
                <div>
                  <p style={{ color: theme.textMain, fontSize: "0.85rem", fontWeight: 600 }}>{totalQuestions > 0 ? Math.round(((wrong + skipped)/totalQuestions)*100) : 0}%</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}>Error / Skip Rate</p>
                </div>
              </div>

              {/* Center Donut Chart */}
              <div style={{ width: "170px", height: "170px", position: "relative", flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                  <p style={{ color: theme.textMain, fontSize: "1.2rem", fontWeight: 600 }}>{totalQuestions}</p>
                  <p style={{ color: theme.textMuted, fontSize: "0.65rem" }}>Total Q's</p>
                </div>
              </div>

              {/* Right Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, alignItems: "flex-end", textAlign: "right" }}>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}><span style={{ color: theme.green }}>●</span> Correct</p>
                  <p style={{ color: theme.textMain, fontSize: "0.85rem", fontWeight: 600 }}>{correct}</p>
                </div>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}><span style={{ color: theme.red }}>●</span> Wrong</p>
                  <p style={{ color: theme.textMain, fontSize: "0.85rem", fontWeight: 600 }}>{wrong}</p>
                </div>
                <div>
                  <p style={{ color: theme.textMuted, fontSize: "0.7rem" }}><span style={{ color: theme.textMuted }}>●</span> Skipped</p>
                  <p style={{ color: theme.textMain, fontSize: "0.85rem", fontWeight: 600 }}>{skipped}</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
      
      {/* Responsive layout breakpoint handler */}
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
    <Suspense fallback={<div style={{ minHeight: "100vh", background: theme.bg, color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Result Engine...</div>}>
      <ResultContent />
    </Suspense>
  );
}