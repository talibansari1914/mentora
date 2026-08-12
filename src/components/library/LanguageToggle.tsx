"use client";

import React from "react";

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
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              border: active ? "1px solid var(--theme-accent-border, #D97706)" : "1px solid var(--theme-border, #CBD5E1)",
              background: active ? "var(--theme-accent, #F59E0B)" : "var(--theme-card-bg, #FFFFFF)",
              color: active ? "var(--theme-accent-text, #0F172A)" : "var(--theme-text-sub, #64748B)",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              boxShadow: active
                ? "0 2px 6px var(--theme-accent-glow, rgba(245, 158, 11, 0.25))"
                : "0 1px 2px rgba(0, 0, 0, 0.03)",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}