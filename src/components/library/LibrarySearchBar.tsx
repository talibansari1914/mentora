"use client";

import React from "react";

interface LibrarySearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function LibrarySearchBar({
  value,
  onChange,
  placeholder,
}: LibrarySearchBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "var(--theme-card-bg, #FFFFFF)",
        border: "1px solid var(--theme-border, #E2E8F0)",
        borderRadius: "14px",
        padding: "12px 18px",
        marginBottom: "20px",
        maxWidth: "560px",
        width: "100%",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <span style={{ fontSize: "1rem", color: "var(--theme-text-sub, #64748B)", flexShrink: 0 }}>
        🔍
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search by book title or author..."}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--theme-text-main, #0F172A)",
          fontSize: "0.9rem",
          fontFamily: "inherit",
          width: "100%",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{
            background: "none",
            border: "none",
            color: "var(--theme-text-sub, #94A3B8)",
            cursor: "pointer",
            fontSize: "0.9rem",
            padding: "2px 4px",
            lineHeight: 1,
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}