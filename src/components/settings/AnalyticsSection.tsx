"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  return (
    <div>
      <SectionHeading title="Analytics" hint="A quick snapshot — open the full Analytics page for charts and subject breakdowns." />

      {loading ? (
        <p style={{ color: "#64748B", fontSize: ".85rem" }}>Loading...</p>
      ) : !summary || summary.totalTests === 0 ? (
        <p style={{ color: "#64748B", fontSize: ".85rem", marginBottom: "20px" }}>
          No test data yet. Attempt a Mock Test or Daily Practice to see stats here.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={{ ...G.card, padding: "16px" }}>
            <p style={{ color: "#64748B", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Total Tests</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800 }}>{summary.totalTests}</p>
          </div>
          <div style={{ ...G.card, padding: "16px" }}>
            <p style={{ color: "#64748B", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Avg Accuracy</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#F59E0B" }}>{Math.round(summary.averageAccuracy)}%</p>
          </div>
          <div style={{ ...G.card, padding: "16px" }}>
            <p style={{ color: "#64748B", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Best Score</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#22C55E" }}>{summary.bestScore}</p>
          </div>
        </div>
      )}

      <Link
        href="/analytics"
        style={{
          display: "inline-block",
          padding: "11px 22px",
          borderRadius: "10px",
          background: G.grad,
          color: "#111827",
          fontWeight: 700,
          fontSize: ".88rem",
          textDecoration: "none",
        }}
      >
        Open Full Analytics →
      </Link>
    </div>
  );
}