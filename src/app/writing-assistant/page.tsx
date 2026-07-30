"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { settingsService } from "@/services/settingsService";

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

type Mode = "essay" | "grammar" | "rewrite" | "paraphrase";

const MODES: { value: Mode; label: string }[] = [
  { value: "essay", label: "Essay Writing" },
  { value: "grammar", label: "Grammar Check" },
  { value: "rewrite", label: "Rewrite" },
  { value: "paraphrase", label: "Reduce Similarity" },
];

const WORD_COUNTS = [150, 250, 500, 1000];
const TONES = ["Formal", "Analytical", "Persuasive", "Simple", "Academic"];

function renderAnswer(text: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={i} style={{ fontSize: "1.35rem", fontWeight: 800, marginTop: i === 0 ? 0 : "20px", marginBottom: "12px" }}>
          {trimmed.slice(2)}
        </h2>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={i} style={{ fontSize: "1.02rem", fontWeight: 700, color: "#F59E0B", marginTop: "18px", marginBottom: "8px" }}>
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
      return <div key={i} style={{ height: "8px" }} />;
    }
    return (
      <p key={i} style={{ color: "#CBD5E1", fontSize: ".92rem", lineHeight: 1.75, marginBottom: "10px" }}>
        {trimmed}
      </p>
    );
  });
}

export default function WritingAssistantPage() {
  const [mode, setMode] = useState<Mode>("essay");
  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(250);
  const [tone, setTone] = useState("Formal");

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Response language, pulled from Settings → AI Mentor. Configured centrally
  // so output language stays consistent across AI features.
  const [mentorLanguage, setMentorLanguage] = useState("english");

  // Maps the AI Mentor "personality" (set in Settings) to a sensible default tone here,
  // so Essay/Rewrite start with a tone that matches how the student wants their mentor to sound.
  const PERSONALITY_TO_TONE: Record<string, string> = {
    Friendly: "Simple",
    "Strict Teacher": "Formal",
    Professional: "Formal",
    Motivational: "Persuasive",
    "Exam Coach": "Analytical",
  };

  useEffect(() => {
    (async () => {
      try {
        const settings = await settingsService.getSettings();
        setMentorLanguage(settings.ai_mentor.language.toLowerCase());
        const mappedTone = PERSONALITY_TO_TONE[settings.ai_mentor.personality];
        if (mappedTone) setTone(mappedTone);
      } catch {
        // Settings couldn't be loaded — fall back to the defaults above.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needsWordCount = mode === "essay";
  const needsTone = mode === "essay" || mode === "rewrite";

  const textLabel: Record<Mode, string> = {
    essay: "Essay Topic",
    grammar: "Paste Your Text",
    rewrite: "Paste Your Text",
    paraphrase: "Paste Your Text",
  };

  const textPlaceholder: Record<Mode, string> = {
    essay: "e.g. Role of Technology in Governance",
    grammar: "Paste the text you want checked...",
    rewrite: "Paste the text you want rewritten...",
    paraphrase: "Paste the text you want to make more original...",
  };

  async function handleSubmit() {
    if (!text.trim()) {
      setError(mode === "essay" ? "Please enter an essay topic." : "Please paste some text.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("/api/writing-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          text,
          wordCount: needsWordCount ? wordCount : undefined,
          tone: needsTone ? tone : undefined,
          responseLanguage: mentorLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to get a response.");
      }

      setAnswer(data.answer);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable — silently ignore
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "white",
    fontSize: ".9rem",
    outline: "none",
    fontFamily: "inherit",
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 16px",
    borderRadius: "10px",
    border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.1)",
    background: active ? G.grad : "transparent",
    color: active ? "#111827" : "#94A3B8",
    fontWeight: 700,
    fontSize: ".82rem",
    cursor: "pointer",
  });

  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px",
    borderRadius: "999px",
    border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.1)",
    background: active ? G.grad : "transparent",
    color: active ? "#111827" : "#94A3B8",
    fontWeight: 700,
    fontSize: ".78rem",
    cursor: "pointer",
  });

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
            AI Writing <span style={G.gradText}>Assistant</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Write essays, fix grammar, rewrite in a different tone, or make your writing more original.
          </p>
          <p style={{ color: "#475569", fontSize: ".78rem", marginTop: "8px" }}>
            Output language: <strong style={{ color: "#94A3B8" }}>{mentorLanguage}</strong> ·{" "}
            <Link href="/settings" style={{ color: "#F59E0B", textDecoration: "none" }}>
              Change in Settings
            </Link>
          </p>
        </header>

        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
          {MODES.map((m) => (
            <button
              key={m.value}
              style={tabBtn(mode === m.value)}
              onClick={() => {
                setMode(m.value);
                setAnswer("");
                setError(null);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ ...G.card, padding: "22px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
              {textLabel[mode]}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={mode === "essay" ? 2 : 8}
              placeholder={textPlaceholder[mode]}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {needsWordCount && (
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
                Word Count
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {WORD_COUNTS.map((w) => (
                  <button key={w} style={chipBtn(wordCount === w)} onClick={() => setWordCount(w)}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsTone && (
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
                Tone
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {TONES.map((t) => (
                  <button key={t} style={chipBtn(tone === t)} onClick={() => setTone(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
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
            {loading ? "Writing..." : "Generate"}
          </button>

          {error && (
            <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>{error}</p>
          )}
        </div>

        {answer && (
          <div style={{ ...G.card, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <button
                onClick={handleCopy}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,.1)",
                  color: copied ? "#22C55E" : "#94A3B8",
                  fontSize: ".78rem",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {renderAnswer(answer)}
          </div>
        )}
      </div>
    </div>
  );
}