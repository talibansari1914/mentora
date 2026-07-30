"use client";

import { useEffect, useState } from "react";
import { testService, TestResult } from "@/services/testService";

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

// Rough, informal accuracy-tier estimate — NOT a real rank prediction.
function estimateTier(accuracy: number) {
  if (accuracy >= 90) return { label: "Excellent range", detail: "Roughly top 1-5% of test-takers score this high." };
  if (accuracy >= 80) return { label: "Very good range", detail: "Roughly top 5-15% of test-takers score this high." };
  if (accuracy >= 70) return { label: "Good range", detail: "Roughly top 15-30% of test-takers score this high." };
  if (accuracy >= 50) return { label: "Average range", detail: "Roughly middle 30-60 percentile." };
  return { label: "Needs work", detail: "Below average — focused practice will move this up quickly." };
}

function renderAnalysis(text: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={i} style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: i === 0 ? 0 : "18px", marginBottom: "10px" }}>
          {trimmed.slice(2)}
        </h2>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={i} style={{ fontSize: "1rem", fontWeight: 700, color: "#F59E0B", marginTop: "16px", marginBottom: "8px" }}>
          {trimmed.slice(3)}
        </h3>
      );
    }
    if (trimmed.startsWith("- ")) {
      return (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", color: "#CBD5E1", fontSize: ".9rem", lineHeight: 1.6 }}>
          <span style={{ color: "#F59E0B" }}>•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }
    if (trimmed === "") {
      return <div key={i} style={{ height: "6px" }} />;
    }
    return (
      <p key={i} style={{ color: "#CBD5E1", fontSize: ".9rem", lineHeight: 1.7, marginBottom: "8px" }}>
        {trimmed}
      </p>
    );
  });
}

export default function MockTestAssistantPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoadingTests(true);
      try {
        const results = await testService.getAllResults();
        setTests(results);
        if (results.length > 0) setSelectedId(results[0].id ?? "");
      } catch (err: any) {
        setLoadError(err.message ?? "Could not load your tests.");
      } finally {
        setLoadingTests(false);
      }
    })();
  }, []);

  const selectedTest = tests.find((t) => t.id === selectedId);

  async function handleAnalyze() {
    if (!selectedTest) return;

    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalysis("");

    try {
      const res = await fetch("/api/mock-test-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedTest),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to analyze this test.");
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setAnalyzeError(err.message ?? "Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "white",
    fontSize: ".9rem",
    outline: "none",
  };

  const tier = selectedTest ? estimateTier(selectedTest.accuracy) : null;

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
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "22px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            Mock Test <span style={G.gradText}>Assistant</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Pick a test to see weak topics, time management feedback, and what to improve next.
          </p>
        </header>

        {loadingTests ? (
          <p style={{ color: "#64748B", fontSize: ".85rem" }}>Loading your tests...</p>
        ) : loadError ? (
          <p style={{ color: "#EF4444", fontSize: ".85rem" }}>{loadError}</p>
        ) : tests.length === 0 ? (
          <div style={{ ...G.card, padding: "40px", textAlign: "center", color: "#64748B" }}>
            No test results yet. Attempt a Mock Test or Daily Practice first.
          </div>
        ) : (
          <>
            <div style={{ ...G.card, padding: "18px", marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
                Select a Test
              </label>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setAnalysis("");
                  setAnalyzeError(null);
                }}
                style={selectStyle}
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} — {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedTest && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ ...G.card, padding: "16px" }}>
                    <p style={{ color: "#64748B", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Score</p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                      {selectedTest.score}/{selectedTest.total}
                    </p>
                  </div>
                  <div style={{ ...G.card, padding: "16px" }}>
                    <p style={{ color: "#64748B", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Accuracy</p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#F59E0B" }}>
                      {Math.round(selectedTest.accuracy)}%
                    </p>
                  </div>
                  <div style={{ ...G.card, padding: "16px" }}>
                    <p style={{ color: "#64748B", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Correct</p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#22C55E" }}>{selectedTest.correct}</p>
                  </div>
                  <div style={{ ...G.card, padding: "16px" }}>
                    <p style={{ color: "#64748B", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Wrong</p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#EF4444" }}>{selectedTest.wrong}</p>
                  </div>
                </div>

                {tier && (
                  <div style={{ ...G.card, padding: "18px", marginBottom: "20px" }}>
                    <p style={{ color: "#94A3B8", fontSize: ".75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
                      Rough Performance Estimate
                    </p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, ...G.gradText, display: "inline-block" }}>{tier.label}</p>
                    <p style={{ color: "#64748B", fontSize: ".8rem", marginTop: "4px" }}>{tier.detail}</p>
                    <p style={{ color: "#64748B", fontSize: ".72rem", marginTop: "8px", fontStyle: "italic" }}>
                      This is an informal estimate based only on your accuracy, not an official rank prediction from real exam data.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  style={{
                    width: "100%",
                    background: G.grad,
                    border: "none",
                    color: "#111827",
                    padding: "13px",
                    borderRadius: "10px",
                    cursor: analyzing ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: ".95rem",
                    opacity: analyzing ? 0.7 : 1,
                    marginBottom: "20px",
                  }}
                >
                  {analyzing ? "Analyzing..." : "Analyze This Test"}
                </button>

                {analyzeError && (
                  <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "16px" }}>{analyzeError}</p>
                )}

                {analysis && <div style={{ ...G.card, padding: "24px" }}>{renderAnalysis(analysis)}</div>}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}