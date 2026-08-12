"use client";

import React from "react";

export type BookToolMode = "explain" | "summary" | "notes" | "quiz" | "translate" | "voice";

const TABS: { value: BookToolMode; label: string; icon: string }[] = [
  { value: "explain", label: "Explain", icon: "💡" },
  { value: "summary", label: "Summary", icon: "📝" },
  { value: "notes", label: "Notes", icon: "📒" },
  { value: "quiz", label: "Quiz", icon: "🎯" },
  { value: "translate", label: "Translate", icon: "🌐" },
  { value: "voice", label: "Read Aloud", icon: "🔊" },
];

export default function BookToolsTabs({
  active,
  onChange,
}: {
  active: BookToolMode;
  onChange: (mode: BookToolMode) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: "6px",
        marginBottom: "20px",
        scrollbarWidth: "none",
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "12px",
              border: isActive
                ? "1px solid var(--theme-accent-border, #D97706)"
                : "1px solid var(--theme-border, #E2E8F0)",
              background: isActive ? "var(--theme-accent, #F59E0B)" : "var(--theme-card-bg, #FFFFFF)",
              color: isActive ? "var(--theme-accent-text, #0F172A)" : "var(--theme-text-sub, #64748B)",
              fontWeight: 700,
              fontSize: "0.86rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: isActive
                ? "0 2px 6px var(--theme-accent-glow, rgba(245, 158, 11, 0.3))"
                : "0 1px 2px rgba(0, 0, 0, 0.03)",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "1rem" }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}