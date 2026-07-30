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

type Mode = "doubt" | "explain" | "debug" | "generate" | "practice";

const MODES: { value: Mode; label: string }[] = [
  { value: "doubt", label: "Doubt" },
  { value: "explain", label: "Explain Code" },
  { value: "debug", label: "Debug" },
  { value: "generate", label: "Generate Code" },
  { value: "practice", label: "Practice Questions" },
];

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C", "Go", "SQL"];

interface ContentBlock {
  type: "text" | "code";
  content: string;
  lang?: string;
}

function parseContent(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    blocks.push({ type: "code", lang: match[1], content: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    blocks.push({ type: "text", content: text.slice(lastIndex) });
  }

  return blocks;
}

function renderTextBlock(text: string, keyPrefix: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    const key = `${keyPrefix}-${i}`;

    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={key} style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: i === 0 ? 0 : "18px", marginBottom: "10px" }}>
          {trimmed.slice(2)}
        </h2>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={key} style={{ fontSize: "1rem", fontWeight: 700, color: "#F59E0B", marginTop: "16px", marginBottom: "6px" }}>
          {trimmed.slice(3)}
        </h3>
      );
    }
    if (trimmed.startsWith("- ")) {
      return (
        <div key={key} style={{ display: "flex", gap: "8px", marginBottom: "5px", color: "#CBD5E1", fontSize: ".9rem", lineHeight: 1.6 }}>
          <span style={{ color: "#F59E0B" }}>•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }
    if (trimmed === "") {
      return <div key={key} style={{ height: "4px" }} />;
    }
    return (
      <p key={key} style={{ color: "#CBD5E1", fontSize: ".9rem", lineHeight: 1.65, marginBottom: "6px" }}>
        {trimmed}
      </p>
    );
  });
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable — silently ignore
    }
  }

  return (
    <div style={{ margin: "10px 0", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#111827",
          padding: "8px 14px",
        }}
      >
        <span style={{ color: "#94A3B8", fontSize: ".75rem", fontWeight: 600 }}>
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: "transparent",
            border: "none",
            color: copied ? "#22C55E" : "#94A3B8",
            fontSize: ".75rem",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "14px",
          background: "#0A0F1A",
          overflowX: "auto",
          fontSize: ".82rem",
          lineHeight: 1.6,
          fontFamily: "'Fira Code','Courier New',monospace",
          color: "#E2E8F0",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderAnswer(text: string) {
  const blocks = parseContent(text);
  return blocks.map((block, i) =>
    block.type === "code" ? (
      <CodeBlock key={i} code={block.content} lang={block.lang} />
    ) : (
      <div key={i}>{renderTextBlock(block.content, `t${i}`)}</div>
    )
  );
}

export default function CodingMentorPage() {
  const [mode, setMode] = useState<Mode>("doubt");
  const [language, setLanguage] = useState("Python");
  const [question, setQuestion] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Mentor personality/style/language, pulled from Settings → AI Mentor.
  // Configured centrally in Settings so tone stays consistent across features.
  const [personality, setPersonality] = useState("Friendly");
  const [explanationStyle, setExplanationStyle] = useState("Detailed");
  const [mentorLanguage, setMentorLanguage] = useState("english");

  useEffect(() => {
    (async () => {
      try {
        const settings = await settingsService.getSettings();
        setPersonality(settings.ai_mentor.personality);
        setExplanationStyle(settings.ai_mentor.explanationStyle);
        setMentorLanguage(settings.ai_mentor.language.toLowerCase());
      } catch {
        // Settings couldn't be loaded — fall back to the defaults above.
      }
    })();
  }, []);

  const needsCode = mode === "explain" || mode === "debug";
  const needsError = mode === "debug";

  const questionLabel: Record<Mode, string> = {
    doubt: "What's your doubt?",
    explain: "Anything specific you want explained? (optional)",
    debug: "Extra context (optional)",
    generate: "Describe what the code should do",
    practice: "Topic for practice questions",
  };

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("/api/code-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          language,
          question,
          code: needsCode ? code : undefined,
          errorMessage: needsError ? errorMessage : undefined,
          personality,
          explanationStyle,
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
      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        <header style={{ marginBottom: "22px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            AI Coding <span style={G.gradText}>Mentor</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Ask a doubt, get your code explained, debug an error, generate code, or practice.
          </p>
          <p style={{ color: "#475569", fontSize: ".78rem", marginTop: "8px" }}>
            Personality: <strong style={{ color: "#94A3B8" }}>{personality}</strong> · Style:{" "}
            <strong style={{ color: "#94A3B8" }}>{explanationStyle}</strong> ·{" "}
            <Link href="/settings" style={{ color: "#F59E0B", textDecoration: "none" }}>
              Change in Settings
            </Link>
          </p>
        </header>

        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
          {MODES.map((m) => (
            <button key={m.value} style={tabBtn(mode === m.value)} onClick={() => setMode(m.value)}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ ...G.card, padding: "22px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
              Language
            </label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={inputStyle}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {needsCode && (
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                Your Code
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                rows={8}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "'Fira Code','Courier New',monospace", fontSize: ".85rem" }}
              />
            </div>
          )}

          {needsError && (
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                Error Message (optional)
              </label>
              <input
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="e.g. TypeError: cannot read property 'x' of undefined"
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
              {questionLabel[mode]}
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={mode === "explain" || mode === "debug" ? 2 : 4}
              placeholder={
                mode === "generate"
                  ? "e.g. A function that checks if a string is a palindrome"
                  : mode === "practice"
                  ? "e.g. Recursion, Linked Lists, Binary Search"
                  : "Type here..."
              }
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

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
            {loading ? "Thinking..." : "Ask Mentor"}
          </button>

          {error && (
            <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>{error}</p>
          )}
        </div>

        {answer && <div style={{ ...G.card, padding: "24px" }}>{renderAnswer(answer)}</div>}
      </div>
    </div>
  );
}