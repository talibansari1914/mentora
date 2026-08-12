"use client";

import React from "react";

interface AnalyticsSummaryCardsProps {
  booksStarted: number;
  booksCompleted: number;
  completionPercent: number;
  estimatedPagesRead: number;
}

export default function AnalyticsSummaryCards({
  booksStarted,
  booksCompleted,
  completionPercent,
  estimatedPagesRead,
}: AnalyticsSummaryCardsProps) {
  const cards = [
    { label: "Books Started", value: booksStarted, color: "var(--theme-text-main, #0F172A)" },
    { label: "Books Completed", value: booksCompleted, color: "#16A34A" },
    { label: "Completion Rate", value: `${completionPercent}%`, color: "var(--theme-accent, #D97706)" },
    { label: "Pages Read", value: estimatedPagesRead.toLocaleString(), color: "#0284C7" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: "var(--theme-card-bg, #FFFFFF)",
            border: "1px solid var(--theme-border, #E2E8F0)",
            borderRadius: "16px",
            padding: "18px 20px",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          <p
            style={{
              color: "var(--theme-text-sub, #64748B)",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px",
              margin: "0 0 8px 0",
            }}
          >
            {card.label}
          </p>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: card.color,
              lineHeight: "1.2",
              margin: 0,
            }}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}