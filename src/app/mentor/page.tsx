"use client";

import { useEffect, useRef, useState } from "react";
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

type Level = "beginner" | "advanced";
type Language = "english" | "hindi" | "hinglish";

interface AttachedFile {
  name: string;
  mimeType: string;
  data: string; // base64
  previewUrl: string;
}

// Small formatter: turns the "# / ## / -" markdown-ish text from the AI
// into styled blocks, without needing a markdown library.
function renderAnswer(text: string) {
  const lines = text.split("\n");

  return lines.map((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      return (
        <h2
          key={i}
          style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            marginTop: i === 0 ? 0 : "22px",
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
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#F59E0B",
            marginTop: "18px",
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

export default function AiTutorPage() {
  const [question, setQuestion] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [language, setLanguage] = useState<Language>("english");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

  // AI Mentor personality/style, pulled from Settings → AI Mentor.
  // These aren't shown as toggles here — they're configured centrally in Settings
  // so the tutor's tone stays consistent everywhere in the app.
  const [personality, setPersonality] = useState("Friendly");
  const [explanationStyle, setExplanationStyle] = useState("Detailed");

  useEffect(() => {
    (async () => {
      try {
        const settings = await settingsService.getSettings();
        setPersonality(settings.ai_mentor.personality);
        setExplanationStyle(settings.ai_mentor.explanationStyle);
        // Default the language toggle to the saved preference, but the
        // student can still override it per-session using the toggle below.
        const savedLang = settings.ai_mentor.language.toLowerCase();
        if (savedLang === "hindi" || savedLang === "hinglish" || savedLang === "english") {
          setLanguage(savedLang as Language);
        }
      } catch {
        // Settings couldn't be loaded — fall back to the defaults above.
      }
    })();
  }, []);

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

    if (!validTypes.includes(file.type)) {
      setError("Only PNG, JPEG, WEBP images or PDF files are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];

      setAttachedFile({
        name: file.name,
        mimeType: file.type,
        data: base64,
        previewUrl: file.type.startsWith("image/") ? result : "",
      });
      setError(null);
    };
    reader.onerror = () => setError("Could not read the file. Please try again.");
    reader.readAsDataURL(file);
  }

  function removeFile() {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!question.trim() && !attachedFile) {
      setError("Please type a question or upload an image/PDF.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          level,
          language,
          personality,
          explanationStyle,
          file: attachedFile
            ? { mimeType: attachedFile.mimeType, data: attachedFile.data }
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to get an answer.");
      }

      setAnswer(data.answer);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 18px",
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
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            AI <span style={G.gradText}>Tutor</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Ask any doubt — type it, or upload an image / PDF (even handwritten notes).
          </p>
          <p style={{ color: "#475569", fontSize: ".78rem", marginTop: "8px" }}>
            Personality: <strong style={{ color: "#94A3B8" }}>{personality}</strong> · Style:{" "}
            <strong style={{ color: "#94A3B8" }}>{explanationStyle}</strong> ·{" "}
            <Link href="/settings" style={{ color: "#F59E0B", textDecoration: "none" }}>
              Change in Settings
            </Link>
          </p>
        </header>

        <div style={{ ...G.card, padding: "22px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your doubt here..."
              rows={4}
              style={{
                width: "100%",
                background: "#0F172A",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: "10px",
                padding: "12px 14px",
                color: "white",
                fontSize: ".9rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {!attachedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                border: "1px dashed rgba(255,255,255,.15)",
                background: "transparent",
                color: "#94A3B8",
                padding: "14px",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: ".85rem",
                marginBottom: "16px",
              }}
            >
              📎 Upload image or PDF (optional)
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: "10px",
                padding: "10px 14px",
                marginBottom: "16px",
              }}
            >
              {attachedFile.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachedFile.previewUrl}
                  alt="attachment preview"
                  style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
                />
              ) : (
                <span style={{ fontSize: "1.4rem" }}>📄</span>
              )}
              <span style={{ fontSize: ".85rem", color: "#CBD5E1", flex: 1 }}>
                {attachedFile.name}
              </span>
              <button
                onClick={removeFile}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#EF4444",
                  cursor: "pointer",
                  fontSize: ".8rem",
                }}
              >
                Remove
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              marginBottom: "18px",
            }}
          >
            <div>
              <p
                style={{
                  color: "#94A3B8",
                  fontSize: ".75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Level
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={toggleBtn(level === "beginner")} onClick={() => setLevel("beginner")}>
                  Beginner
                </button>
                <button style={toggleBtn(level === "advanced")} onClick={() => setLevel("advanced")}>
                  Advanced
                </button>
              </div>
            </div>

            <div>
              <p
                style={{
                  color: "#94A3B8",
                  fontSize: ".75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Language
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={toggleBtn(language === "english")} onClick={() => setLanguage("english")}>
                  English
                </button>
                <button style={toggleBtn(language === "hindi")} onClick={() => setLanguage("hindi")}>
                  Hindi
                </button>
                <button style={toggleBtn(language === "hinglish")} onClick={() => setLanguage("hinglish")}>
                  Hinglish
                </button>
              </div>
            </div>
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
            {loading ? "Thinking..." : "Solve My Doubt"}
          </button>

          {error && (
            <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>
              {error}
            </p>
          )}
        </div>

        {answer && (
          <div style={{ ...G.card, padding: "26px" }}>{renderAnswer(answer)}</div>
        )}
      </div>
    </div>
  );
}