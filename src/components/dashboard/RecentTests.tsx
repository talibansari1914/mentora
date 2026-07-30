"use client";

import Link from "next/link";
import { G } from "@/constants/colors";

interface Test {
  id?: string;
  title: string;
  score: number;
  total: number;
  accuracy: number;
  created_at?: string;
}

interface RecentTestsProps {
  tests: Test[];
}

export default function RecentTests({ tests }: RecentTestsProps) {
  return (
    <section style={{ ...G.card, padding: "22px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Recent Tests</h3>
        <Link href="/mock-tests" style={{ color: "#F59E0B", textDecoration: "none", fontSize: ".82rem" }}>
          View All
        </Link>
      </div>

      {tests.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: ".85rem", textAlign: "center", padding: "20px 0" }}>
          No tests attempted yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {tests.map((test, i) => (
            <div
              key={test.id ?? i}
              style={{
                background: "#0F172A",
                borderRadius: "14px",
                padding: "16px",
                border: "1px solid rgba(255,255,255,.05)",
                transition: "border-color .15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,.2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.05)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", gap: "10px" }}>
                <h4
                  style={{
                    fontWeight: 700,
                    fontSize: ".92rem",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {test.title}
                </h4>
                <span style={{ color: "#F59E0B", fontWeight: 700, flexShrink: 0 }}>
                  {test.score}/{test.total}
                </span>
              </div>

              <div
                style={{
                  height: "8px",
                  background: "#1E293B",
                  borderRadius: "100px",
                  overflow: "hidden",
                  marginBottom: "8px",
                }}
              >
                <div style={{ width: `${test.accuracy}%`, height: "100%", background: G.grad }} />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#94A3B8",
                  fontSize: ".78rem",
                  flexWrap: "wrap",
                  gap: "4px",
                }}
              >
                <span>{test.accuracy}% Accuracy</span>
                <span>{test.created_at ? new Date(test.created_at).toLocaleDateString() : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}