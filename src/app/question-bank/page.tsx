"use client";

import { useState } from "react";
import Link from "next/link";
import { TEST_LOOKUP, TestMeta } from "@/lib/questionBank";
import { gradAmber, gradTextAmber } from "@/lib/theme";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";

const G = { grad: gradAmber, gradText: gradTextAmber };

const EXAM_LABELS: Record<TestMeta["exam"], string> = {
  jee: "JEE",
  neet: "NEET",
  upsc: "UPSC",
  ssc: "SSC",
};

const FILTERS: Array<TestMeta["exam"] | "all"> = [
  "all",
  "jee",
  "neet",
  "upsc",
  "ssc",
];

// Static theme-token style map — driven entirely by the shared --theme-* CSS
// variables set on <html data-theme="dark|light">, so this page always mirrors
// the dashboard toggle exactly with zero extra JS/state.
const themeStyles = {
  bg: "var(--theme-bg-main)",
  color: "var(--theme-text-main)",
  subText: "var(--theme-text-sub)",
  cardBg: "var(--theme-card-bg)",
  cardBorder: "1px solid var(--theme-border)",
};

export default function QuestionBankPage() {
  const [filter, setFilter] = useState<TestMeta["exam"] | "all">("all");

  const tests = Object.values(TEST_LOOKUP).filter(
    (t) => filter === "all" || t.exam === filter
  );

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: themeStyles.cardBorder,
    borderRadius: "16px",
    transition: "background 0.3s, border 0.3s",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeStyles.bg,
        color: themeStyles.color,
        fontFamily: "'DM Sans',sans-serif",
        padding: "clamp(16px, 4vw, 32px)",
        transition: "background 0.3s, color 0.3s",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header style={{ marginBottom: "28px" }}>
          <BackToDashboardLink />
          <h1
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2rem)",
              fontWeight: 800,
              marginBottom: "8px",
              color: themeStyles.color,
            }}
          >
            Question <span style={G.gradText}>Bank</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: ".95rem" }}>
            Practice tests organized by exam. Pick one and start attempting.
          </p>
        </header>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                border: filter === f ? "1px solid transparent" : "1px solid var(--theme-border)",
                background: filter === f ? G.grad : "transparent",
                color: filter === f ? "var(--theme-accent-text)" : themeStyles.subText,
                fontWeight: 700,
                fontSize: ".82rem",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: ".03em",
                transition: "all 0.2s",
              }}
            >
              {f === "all" ? "All" : EXAM_LABELS[f]}
            </button>
          ))}
        </div>

        {tests.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              padding: "40px",
              textAlign: "center",
              color: themeStyles.subText,
            }}
          >
            No tests found for this exam yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: "16px",
            }}
          >
            {tests.map((test) => (
              <Link
                key={test.id}
                href={`/mock-tests/${test.id}`}
                style={{
                  ...cardStyle,
                  padding: "20px",
                  textDecoration: "none",
                  color: themeStyles.color,
                  display: "block",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: ".68rem",
                      fontWeight: 700,
                      color: "var(--theme-accent)",
                      background: "var(--theme-accent-soft)",
                      border: "1px solid var(--theme-accent-border)",
                      borderRadius: "100px",
                      padding: "2px 10px",
                      textTransform: "uppercase",
                    }}
                  >
                    {EXAM_LABELS[test.exam]}
                  </span>

                  {test.negMark && (
                    <span
                      style={{
                        fontSize: ".68rem",
                        color: "#EF4444",
                        fontWeight: 600,
                      }}
                    >
                      Negative Marking
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    marginBottom: "10px",
                    lineHeight: 1.4,
                    color: themeStyles.color,
                  }}
                >
                  {test.title}
                </h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: themeStyles.subText,
                    fontSize: ".82rem",
                  }}
                >
                  <span>⏱️</span>
                  <span>{test.duration} min</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:600px){div[style*="repeat(auto-fill"]{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}