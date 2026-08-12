"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Target, Trophy, ArrowRight, Loader2, FileX } from "lucide-react";
import { G, SectionHeading } from "./shared";
import { testService } from "@/services/testService";

export default function AnalyticsSection() {
  const [summary, setSummary] = useState<{
    totalTests: number;
    averageAccuracy: number;
    bestScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await testService.getPerformanceSummary();
        setSummary(data);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no localStorage polling, no interval — it stays perfectly
  // in sync and reacts instantly to the toggle.
  const cardStyle: React.CSSProperties = {
    ...G.card,
    background: "var(--theme-card-bg)",
    border: "1px solid var(--theme-border)",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "10px",
    transition: "transform 0.18s ease-out",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--theme-text-sub)",
    fontSize: "0.72rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  const valStyle: React.CSSProperties = {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "var(--theme-text-main)",
    lineHeight: 1.2,
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <SectionHeading
        title="Analytics"
        hint="A quick snapshot — open the full Analytics page for charts and subject breakdowns."
      />

      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--theme-text-sub)",
            fontSize: "0.85rem",
            padding: "16px 0",
          }}
        >
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading analytics summary...</span>
        </div>
      ) : !summary || summary.totalTests === 0 ? (
        <div
          style={{
            background: "var(--theme-hover-bg)",
            border: "1px solid var(--theme-border)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "var(--theme-text-sub)",
            fontSize: "0.85rem",
          }}
        >
          <FileX size={20} style={{ flexShrink: 0, opacity: 0.7 }} />
          <span>
            No test data yet. Attempt a Mock Test or Daily Practice to see stats here.
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          {/* Total Tests Card */}
          <div style={cardStyle}>
            <div style={labelStyle}>
              <BarChart3 size={15} style={{ color: "var(--theme-accent)" }} />
              <span>Total Tests</span>
            </div>
            <p style={valStyle}>{summary.totalTests}</p>
          </div>

          {/* Avg Accuracy Card */}
          <div style={cardStyle}>
            <div style={labelStyle}>
              <Target size={15} style={{ color: "var(--theme-accent)" }} />
              <span>Avg Accuracy</span>
            </div>
            <p style={{ ...valStyle, color: "var(--theme-accent)" }}>
              {Math.round(summary.averageAccuracy)}%
            </p>
          </div>

          {/* Best Score Card */}
          <div style={cardStyle}>
            <div style={labelStyle}>
              <Trophy size={15} style={{ color: "#22C55E" }} />
              <span>Best Score</span>
            </div>
            <p style={{ ...valStyle, color: "#22C55E" }}>{summary.bestScore}</p>
          </div>
        </div>
      )}

      {/* Action Link - Mobile Responsive */}
      <Link
        href="/analytics"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "11px 22px",
          borderRadius: "10px",
          background: G.grad || "linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-accent) 100%)",
          color: "var(--theme-accent-text)",
          fontWeight: 700,
          fontSize: "0.88rem",
          textDecoration: "none",
          width: "100%",
          maxWidth: "220px",
          boxShadow: "0 4px 12px var(--theme-accent-glow)",
          transition: "transform 0.15s ease, opacity 0.2s ease",
        }}
      >
        <span>Open Full Analytics</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}