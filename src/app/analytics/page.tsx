"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { testService } from "@/services/testService";

const G = {
  grad: "linear-gradient(135deg,#F59E0B,#FBBF24)",
  gradText: {
    background: "linear-gradient(135deg,#F59E0B,#FBBF24)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  card: {
    background: "#0B1220",
    border: "1px solid rgba(255,255,255,.06)",
    borderRadius: "16px",
  },
};

const EXAMS = [
  { value: "", label: "All Exams" },
  { value: "upsc", label: "UPSC" },
  { value: "jee", label: "JEE" },
  { value: "neet", label: "NEET" },
  { value: "ssc", label: "SSC" },
];

interface WeeklyPoint {
  date: string;
  score: number;
  accuracy: number;
  tests: number;
}

interface SubjectPoint {
  subject: string;
  averageAccuracy: number;
  averageScore: number;
  tests: number;
  correct: number;
  wrong: number;
  skipped: number;
}

interface Summary {
  totalTests: number;
  averageScore: number;
  averageAccuracy: number;
  bestScore: number;
  highestAccuracy: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ ...G.card, padding: "18px" }}>
      <p style={{ color: "#64748B", fontSize: ".75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
        {label}
      </p>
      <p style={{ fontSize: "1.6rem", fontWeight: 800, color: color ?? "white" }}>{value}</p>
    </div>
  );
}

// Donut ring — e.g. "65 out of 100"
function DonutStat({
  label,
  value,
  max,
  color,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  const size = 140;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = circumference * pct;

  return (
    <div style={{ ...G.card, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            {Math.round(value)}
            {suffix}
          </p>
        </div>
      </div>
      <p style={{ color: "#94A3B8", fontSize: ".8rem", fontWeight: 600, marginTop: "10px" }}>{label}</p>
      <p style={{ color: "#64748B", fontSize: ".72rem" }}>
        {Math.round(value)} out of {max}
      </p>
    </div>
  );
}

// Rounded pill-shaped vertical bar chart — subject-wise accuracy comparison
function PillBarChart({ data }: { data: SubjectPoint[] }) {
  if (data.length === 0) {
    return (
      <p style={{ color: "#64748B", fontSize: ".85rem", textAlign: "center", padding: "30px 0" }}>
        No subject data yet.
      </p>
    );
  }

  const trackHeight = 130;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "18px", height: `${trackHeight + 30}px` }}>
      {data.map((s) => {
        const pct = Math.max(Math.round(s.averageAccuracy), 4);
        const filledHeight = (pct / 100) * trackHeight;
        const color = pct >= 70 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444";

        return (
          <div key={s.subject} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div
              style={{
                position: "relative",
                width: "22px",
                height: `${trackHeight}px`,
                background: "rgba(255,255,255,.06)",
                borderRadius: "999px",
                display: "flex",
                alignItems: "flex-end",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${filledHeight}px`,
                  background: color,
                  borderRadius: "999px",
                }}
              />
            </div>
            <p
              style={{
                marginTop: "8px",
                fontSize: ".72rem",
                color: "#94A3B8",
                textAlign: "center",
                maxWidth: "60px",
                lineHeight: 1.2,
              }}
            >
              {s.subject}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Dual-line trend chart — Score vs Accuracy over recent tests
function TrendLineChart({ data }: { data: WeeklyPoint[] }) {
  if (data.length < 2) {
    return (
      <p style={{ color: "#64748B", fontSize: ".85rem", textAlign: "center", padding: "30px 0" }}>
        Need at least 2 days of test data to show a trend.
      </p>
    );
  }

  const width = 100;
  const height = 60;
  const stepX = width / (data.length - 1);

  const maxScore = Math.max(...data.map((d) => d.score), 1);

  const accuracyPoints = data
    .map((d, i) => `${i * stepX},${height - (d.accuracy / 100) * height}`)
    .join(" ");

  const scorePoints = data
    .map((d, i) => `${i * stepX},${height - (d.score / maxScore) * height}`)
    .join(" ");

  return (
    <div>
      <svg viewBox={`-2 -6 ${width + 4} ${height + 18}`} width="100%" style={{ overflow: "visible" }}>
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={height * f}
            y2={height * f}
            stroke="rgba(255,255,255,.06)"
            strokeWidth={0.3}
          />
        ))}

        <polyline points={accuracyPoints} fill="none" stroke="#F59E0B" strokeWidth={1.2} strokeLinejoin="round" />
        <polyline points={scorePoints} fill="none" stroke="#38BDF8" strokeWidth={1.2} strokeLinejoin="round" />

        {data.map((d, i) => (
          <circle key={`a-${d.date}`} cx={i * stepX} cy={height - (d.accuracy / 100) * height} r={0.9} fill="#F59E0B" />
        ))}
        {data.map((d, i) => (
          <circle key={`s-${d.date}`} cx={i * stepX} cy={height - (d.score / maxScore) * height} r={0.9} fill="#38BDF8" />
        ))}

        {data.map((d, i) => (
          <text
            key={`t-${d.date}`}
            x={i * stepX}
            y={height + 8}
            fontSize={2.6}
            fill="#64748B"
            textAnchor="middle"
          >
            {d.date.slice(5)}
          </text>
        ))}
      </svg>

      <div style={{ display: "flex", gap: "20px", marginTop: "12px", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
          <span style={{ fontSize: ".78rem", color: "#94A3B8" }}>Accuracy</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38BDF8", display: "inline-block" }} />
          <span style={{ fontSize: ".78rem", color: "#94A3B8" }}>Score</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [exam, setExam] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [weekly, setWeekly] = useState<WeeklyPoint[]>([]);
  const [subjects, setSubjects] = useState<SubjectPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const examParam = exam || undefined;
        const [summaryData, weeklyData, subjectData] = await Promise.all([
          testService.getPerformanceSummary(examParam),
          testService.getWeeklyPerformance(examParam),
          testService.getSubjectTrend(examParam),
        ]);

        if (!cancelled) {
          setSummary(summaryData);
          setWeekly(weeklyData);
          setSubjects(subjectData);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Could not load analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [exam]);

  const { strongSubjects, weakSubjects } = useMemo(() => {
    const sorted = [...subjects].sort((a, b) => b.averageAccuracy - a.averageAccuracy);
    return {
      strongSubjects: sorted.slice(0, 3),
      weakSubjects: [...sorted].reverse().slice(0, 3),
    };
  }, [subjects]);

  const recentWeekly = weekly.slice(-7);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080C14",
        color: "white",
        fontFamily: "'DM Sans',sans-serif",
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
              Performance <span style={G.gradText}>Analysis</span>
            </h1>
            <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
              Track your accuracy, scores, and subject-wise strengths over time.
            </p>
          </div>

          <select
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            style={{
              background: "#0F172A",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "10px",
              padding: "10px 14px",
              color: "white",
              fontSize: ".85rem",
              outline: "none",
            }}
          >
            {EXAMS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </header>

        <Link
          href="/mock-test-assistant"
          style={{
            display: "inline-block",
            marginBottom: "20px",
            padding: "10px 18px",
            borderRadius: "10px",
            border: "1px solid rgba(245,158,11,.25)",
            background: "rgba(245,158,11,.08)",
            color: "#F59E0B",
            fontSize: ".85rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          🧪 Get AI Analysis on a Specific Test →
        </Link>

        {error && (
          <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "16px" }}>{error}</p>
        )}

        {loading ? (
          <p style={{ color: "#64748B", fontSize: ".85rem" }}>Loading analytics...</p>
        ) : !summary || summary.totalTests === 0 ? (
          <div style={{ ...G.card, padding: "40px", textAlign: "center", color: "#64748B" }}>
            No test data yet. Attempt a mock test or daily practice to see your analytics here.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <DonutStat
                label="Avg Accuracy"
                value={summary.averageAccuracy}
                max={100}
                color="#F59E0B"
                suffix="%"
              />
              <DonutStat
                label="Correct Rate"
                value={
                  summary.totalCorrect + summary.totalWrong + summary.totalSkipped > 0
                    ? (summary.totalCorrect /
                        (summary.totalCorrect + summary.totalWrong + summary.totalSkipped)) *
                      100
                    : 0
                }
                max={100}
                color="#38BDF8"
                suffix="%"
              />
              <StatCard label="Total Tests" value={summary.totalTests} />
              <StatCard label="Best Score" value={summary.bestScore} color="#22C55E" />
            </div>

            <div style={{ ...G.card, padding: "22px", marginBottom: "20px" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "20px" }}>Subject-wise Accuracy</h3>
              <PillBarChart data={subjects.slice().sort((a, b) => b.averageAccuracy - a.averageAccuracy).slice(0, 8)} />
            </div>

            <div style={{ ...G.card, padding: "22px", marginBottom: "20px" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "16px" }}>Score &amp; Accuracy Trend</h3>
              <TrendLineChart data={recentWeekly} />
            </div>

            {weakSubjects.length > 0 && (
              <div style={{ ...G.card, padding: "22px" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "14px", color: "#EF4444" }}>
                  Focus Areas
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {weakSubjects.map((s) => (
                    <div
                      key={s.subject}
                      style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem" }}
                    >
                      <span>{s.subject}</span>
                      <span style={{ color: "#EF4444", fontWeight: 700 }}>
                        {Math.round(s.averageAccuracy)}% accuracy
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}