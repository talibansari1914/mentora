"use client";

import { G } from "@/constants/colors";

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
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "10px",
              border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,.08)",
              background: isActive ? G.grad : "transparent",
              color: isActive ? "#111827" : "#94A3B8",
              fontWeight: 700,
              fontSize: ".84rem",
              cursor: "pointer",
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}