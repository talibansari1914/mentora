"use client";

import Link from "next/link";
import { G } from "@/constants/colors";
import { formatDate, type DateFormat } from "@/lib/dateFormat";

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
  dateFormat?: DateFormat;
}

export default function RecentTests({ tests, dateFormat = "DD/MM/YYYY" }: RecentTestsProps) {
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
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "var(--theme-text-main, #F8FAFC)",
          }}
        >
          Recent Tests
        </h3>
        <Link
          href="/mock-tests"
          style={{
            color: "var(--theme-accent, #F59E0B)",
            textDecoration: "none",
            fontSize: ".82rem",
            fontWeight: 600,
          }}
        >
          View All
        </Link>
      </div>

      {tests.length === 0 ? (
        <p
          style={{
            color: "var(--theme-muted-text, #64748B)",
            fontSize: ".85rem",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          No tests attempted yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {tests.map((test, i) => (
            <div
              key={test.id ?? i}
              style={{
                background: "var(--theme-hover-bg, rgba(255, 255, 255, 0.03))",
                borderRadius: "14px",
                padding: "16px",
                border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.07))",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--theme-accent-border, rgba(245, 158, 11, 0.3))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--theme-border, rgba(255, 255, 255, 0.07))";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  gap: "10px",
                }}
              >
                <h4
                  style={{
                    fontWeight: 700,
                    fontSize: ".92rem",
                    color: "var(--theme-text-main, #F8FAFC)",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {test.title}
                </h4>
                <span
                  style={{
                    color: "var(--theme-accent, #F59E0B)",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {test.score}/{test.total}
                </span>
              </div>

              <div
                style={{
                  height: "8px",
                  background: "var(--theme-border, #1E293B)",
                  borderRadius: "100px",
                  overflow: "hidden",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: `${test.accuracy}%`,
                    height: "100%",
                    background: G.grad,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--theme-text-sub, #94A3B8)",
                  fontSize: ".78rem",
                  flexWrap: "wrap",
                  gap: "4px",
                }}
              >
                <span>{test.accuracy}% Accuracy</span>
                <span>
                  {test.created_at ? formatDate(test.created_at, dateFormat) : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}