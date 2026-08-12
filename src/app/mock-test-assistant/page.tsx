"use client";

import { useEffect, useState } from "react";
import { testService, TestResult } from "@/services/testService";
import { gradAmber, gradTextAmber } from "@/lib/theme";
import { renderMarkdownLite } from "@/lib/renderMarkdownLite";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { settingsService } from "@/services/settingsService";
import { formatDate, type DateFormat } from "@/lib/dateFormat";
import { getErrorMessage } from "@/lib/errors";

const G = {
  grad: gradAmber,
  gradText: gradTextAmber,
  card: {
    background: "var(--theme-card-bg, #0B1220)",
    border: "1px solid var(--theme-border, rgba(255,255,255,.06))",
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

export default function MockTestAssistantPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>("DD/MM/YYYY");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingTests(true);
      try {
        const results = await testService.getAllResults();
        if (cancelled) return;
        setTests(results);
        if (results.length > 0) setSelectedId(results[0].id ?? "");
      } catch (err: unknown) {
        if (!cancelled) setLoadError(getErrorMessage(err, "Could not load your tests."));
      } finally {
        if (!cancelled) setLoadingTests(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    settingsService
      .getSettings()
      .then((settings) => {
        if (!cancelled) setDateFormat(settings.language_region.dateFormat as DateFormat);
      })
      .catch(() => {
        // Not fatal — this page still works with the default format.
      });
    return () => {
      cancelled = true;
    };
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
    } catch (err: unknown) {
      setAnalyzeError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setAnalyzing(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--theme-hover-bg, #0F172A)",
    border: "1px solid var(--theme-border, rgba(255,255,255,.08))",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "var(--theme-text-main, #F8FAFC)",
    fontSize: ".9rem",
    outline: "none",
  };

  const tier = selectedTest ? estimateTier(selectedTest.accuracy) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--theme-bg-main, #080C14)",
        color: "var(--theme-text-main, #F8FAFC)",
        fontFamily: "'DM Sans',sans-serif",
        padding: "clamp(16px, 4vw, 32px)",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "22px" }}>
          <BackToDashboardLink />
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2rem)", fontWeight: 800, marginBottom: "8px", color: "var(--theme-text-main, #F8FAFC)" }}>
            Mock Test <span style={G.gradText}>Assistant</span>
          </h1>
          <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: ".95rem" }}>
            Pick a test to see weak topics, time management feedback, and what to improve next.
          </p>
        </header>

        {loadingTests ? (
          <p style={{ color: "var(--theme-muted-text, #64748B)", fontSize: ".85rem" }}>Loading your tests...</p>
        ) : loadError ? (
          <p style={{ color: "#EF4444", fontSize: ".85rem" }}>{loadError}</p>
        ) : tests.length === 0 ? (
          <div style={{ ...G.card, padding: "40px", textAlign: "center", color: "var(--theme-muted-text, #64748B)" }}>
            No test results yet. Attempt a Mock Test or Daily Practice first.
          </div>
        ) : (
          <>
            <div style={{ ...G.card, padding: "18px", marginBottom: "20px" }}>
              <label style={{ display: "block", color: "var(--theme-text-sub, #94A3B8)", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
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
                    {t.title} — {t.created_at ? formatDate(t.created_at, dateFormat) : ""}
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
                    <p style={{ color: "var(--theme-muted-text, #64748B)", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Score</p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--theme-text-main, #F8FAFC)" }}>
                      {selectedTest.score}/{selectedTest.total}
                    </p>
                  </div>
                  <div style={{ ...G.card, padding: "16px" }}>
                    <p style={{ color: "var(--theme-muted-text, #64748B)", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Accuracy</p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--theme-accent, #F59E0B)" }}>
                      {Math.round(selectedTest.accuracy)}%
                    </p>
                  </div>
                  <div style={{ ...G.card, padding: "16px" }}>
                    <p style={{ color: "var(--theme-muted-text, #64748B)", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Correct</p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#22C55E" }}>{selectedTest.correct}</p>
                  </div>
                  <div style={{ ...G.card, padding: "16px" }}>
                    <p style={{ color: "var(--theme-muted-text, #64748B)", fontSize: ".72rem", textTransform: "uppercase", marginBottom: "4px" }}>Wrong</p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#EF4444" }}>{selectedTest.wrong}</p>
                  </div>
                </div>

                {tier && (
                  <div style={{ ...G.card, padding: "18px", marginBottom: "20px" }}>
                    <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: ".75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
                      Rough Performance Estimate
                    </p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, ...G.gradText, display: "inline-block" }}>{tier.label}</p>
                    <p style={{ color: "var(--theme-muted-text, #64748B)", fontSize: ".8rem", marginTop: "4px" }}>{tier.detail}</p>
                    <p style={{ color: "var(--theme-muted-text, #64748B)", fontSize: ".72rem", marginTop: "8px", fontStyle: "italic" }}>
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
                    color: "var(--theme-accent-text, #111827)",
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

                {analysis && <div style={{ ...G.card, padding: "24px" }}>{renderMarkdownLite(analysis)}</div>}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}