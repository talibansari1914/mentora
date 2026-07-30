"use client";

import { G } from "@/constants/colors";

export type PersonalTab = "favorites" | "wishlist" | "continue" | "completed" | "history" | "collections";

const TABS: { value: PersonalTab; label: string; icon: string }[] = [
  { value: "continue", label: "Continue Reading", icon: "📖" },
  { value: "favorites", label: "Favorites", icon: "🔖" },
  { value: "wishlist", label: "Wishlist", icon: "💛" },
  { value: "completed", label: "Completed", icon: "✅" },
  { value: "history", label: "Reading History", icon: "🕓" },
  { value: "collections", label: "Collections", icon: "📁" },
];

export default function PersonalLibraryTabs({
  active,
  onChange,
}: {
  active: PersonalTab;
  onChange: (tab: PersonalTab) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
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