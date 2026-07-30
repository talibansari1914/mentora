"use client";

import { useState } from "react";
import Link from "next/link";
import { TEST_LOOKUP, TestMeta } from "@/lib/questionBank";

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

export default function QuestionBankPage() {
  const [filter, setFilter] = useState<TestMeta["exam"] | "all">("all");

  const tests = Object.values(TEST_LOOKUP).filter(
    (t) => filter === "all" || t.exam === filter
  );

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
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              marginBottom: "8px",
            }}
          >
            Question <span style={G.gradText}>Bank</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
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
                border:
                  filter === f
                    ? "1px solid transparent"
                    : "1px solid rgba(255,255,255,.1)",
                background: filter === f ? G.grad : "transparent",
                color: filter === f ? "#111827" : "#94A3B8",
                fontWeight: 700,
                fontSize: ".82rem",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: ".03em",
              }}
            >
              {f === "all" ? "All" : EXAM_LABELS[f]}
            </button>
          ))}
        </div>

        {tests.length === 0 ? (
          <div
            style={{
              ...G.card,
              padding: "40px",
              textAlign: "center",
              color: "#64748B",
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
                  ...G.card,
                  padding: "20px",
                  textDecoration: "none",
                  color: "white",
                  display: "block",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: ".68rem",
                      fontWeight: 700,
                      color: "#F59E0B",
                      background: "rgba(245,158,11,.1)",
                      border: "1px solid rgba(245,158,11,.2)",
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
                  }}
                >
                  {test.title}
                </h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#64748B",
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
    </div>
  );
}
