"use client";

import { useMemo, useState } from "react";

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
  { value: "upsc", label: "UPSC" },
  { value: "jee", label: "JEE" },
  { value: "neet", label: "NEET" },
  { value: "ssc", label: "SSC" },
];

const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  upsc: ["Polity", "History", "Geography", "Economy", "Environment", "CSAT"],
  jee: ["Physics", "Chemistry", "Maths"],
  neet: ["Biology", "Physics", "Chemistry"],
  ssc: ["Reasoning", "Quant", "English", "GK"],
};

// Very small formatter: turns the "# / ## / -" markdown-ish text from the AI
// into styled blocks, without needing a markdown library.
function renderNotes(text: string) {
  const lines = text.split("\n");

  return lines.map((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      return (
        <h2
          key={i}
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            marginTop: i === 0 ? 0 : "24px",
            marginBottom: "12px",
          }}
        >
          {trimmed.slice(2)}
        </h2>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h3
          key={i}
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#F59E0B",
            marginTop: "20px",
            marginBottom: "8px",
          }}
        >
          {trimmed.slice(3)}
        </h3>
      );
    }

    if (trimmed.startsWith("- ")) {
      return (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "6px",
            color: "#CBD5E1",
            fontSize: ".92rem",
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: "#F59E0B" }}>•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }

    if (trimmed === "") {
      return <div key={i} style={{ height: "6px" }} />;
    }

    return (
      <p
        key={i}
        style={{
          color: "#CBD5E1",
          fontSize: ".92rem",
          lineHeight: 1.7,
          marginBottom: "8px",
        }}
      >
        {trimmed}
      </p>
    );
  });
}

export default function NotesGeneratorPage() {
  const [exam, setExam] = useState("upsc");
  const [subject, setSubject] = useState(SUBJECTS_BY_EXAM["upsc"][0]);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjectOptions = useMemo(() => SUBJECTS_BY_EXAM[exam] ?? [], [exam]);

  function handleExamChange(value: string) {
    setExam(value);
    setSubject(SUBJECTS_BY_EXAM[value]?.[0] ?? "");
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Topic likhna zaroori hai.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotes("");

    try {
      const res = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, subject, topic }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Notes generate nahi ho paye.");
      }

      setNotes(data.notes);
    } catch (err: any) {
      setError(err.message ?? "Kuch galat ho gaya.");
    } finally {
      setLoading(false);
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#94A3B8",
    fontSize: ".78rem",
    fontWeight: 600,
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: ".03em",
  };

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
        <header style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            Notes <span style={G.gradText}>Generator</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Exam, subject aur topic chuno — AI step-by-step notes bana dega.
          </p>
        </header>

        <div style={{ ...G.card, padding: "22px", marginBottom: "20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: "14px",
              marginBottom: "14px",
            }}
          >
            <div>
              <label style={labelStyle}>Exam</label>
              <select
                value={exam}
                onChange={(e) => handleExamChange(e.target.value)}
                style={selectStyle}
              >
                {EXAMS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={selectStyle}
              >
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Newton's Laws of Motion, French Revolution..."
              style={selectStyle}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: "100%",
              background: G.grad,
              border: "none",
              color: "#111827",
              padding: "13px",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: ".95rem",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Generating..." : "Generate Notes"}
          </button>

          {error && (
            <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>
              {error}
            </p>
          )}
        </div>

        {notes && (
          <div style={{ ...G.card, padding: "26px" }}>{renderNotes(notes)}</div>
        )}
      </div>
    </div>
  );
}