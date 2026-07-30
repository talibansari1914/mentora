"use client";

import { G } from "@/constants/colors";

export type BookToolsLanguage = "english" | "hindi" | "hinglish";

const OPTIONS: { value: BookToolsLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "hinglish", label: "Hinglish" },
];

export default function LanguageToggle({
  value,
  onChange,
}: {
  value: BookToolsLanguage;
  onChange: (v: BookToolsLanguage) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.1)",
              background: active ? G.grad : "transparent",
              color: active ? "#111827" : "#94A3B8",
              fontWeight: 700,
              fontSize: ".8rem",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}