"use client";

import type { SettingsTab } from "./types";

const GROUPS: { title: string; items: { value: SettingsTab; label: string; icon: string }[] }[] = [
  {
    title: "Account",
    items: [
      { value: "profile", label: "Profile", icon: "👤" },
      { value: "privacy", label: "Privacy & Security", icon: "🔒" },
    ],
  },
  {
    title: "Study",
    items: [
      { value: "study", label: "Study Preferences", icon: "📚" },
      { value: "ai", label: "AI Mentor", icon: "🤖" },
      { value: "learning", label: "Learning", icon: "🎯" },
      { value: "analytics", label: "Analytics", icon: "📊" },
    ],
  },
  {
    title: "App",
    items: [
      { value: "notifications", label: "Notifications", icon: "🔔" },
      { value: "appearance", label: "Appearance", icon: "🎨" },
      { value: "language", label: "Language & Region", icon: "🌍" },
    ],
  },
  {
    title: "More",
    items: [
      { value: "help", label: "Help & Support", icon: "❓" },
      { value: "about", label: "About", icon: "ℹ️" },
    ],
  },
];

export default function SettingsNav({ active, onChange }: { active: SettingsTab; onChange: (t: SettingsTab) => void }) {
  return (
    <nav>
      {GROUPS.map((group) => (
        <div key={group.title} style={{ marginBottom: "20px" }}>
          <p
            style={{
              color: "#475569",
              fontSize: ".7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".04em",
              marginBottom: "8px",
              padding: "0 14px",
            }}
          >
            {group.title}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {group.items.map((item) => (
              <button
                key={item.value}
                onClick={() => onChange(item.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: active === item.value ? "rgba(245,158,11,.1)" : "transparent",
                  color: active === item.value ? "#F59E0B" : "#94A3B8",
                  fontWeight: active === item.value ? 700 : 600,
                  fontSize: ".85rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}