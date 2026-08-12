"use client";

import React from "react";

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
    <div
      style={{
        display: "flex",
        gap: "10px",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: "6px",
        marginBottom: "24px",
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