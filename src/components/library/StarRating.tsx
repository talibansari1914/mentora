"use client";

import React from "react";

export default function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      <span style={{ color: "var(--theme-accent, #F59E0B)", fontSize: "0.75rem", lineHeight: 1 }}>★</span>
      <span style={{ fontSize: "0.75rem", color: "var(--theme-text-sub, #475569)", fontWeight: 700 }}>
        {rating}
      </span>
    </div>
  );
}