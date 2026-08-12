"use client";

import { G } from "@/constants/colors";

interface StatsCardsProps {
  booksRead: number;
  testsAttempted: number;
  accuracy: number;
  studyHours: number;
}

export default function StatsCards({ booksRead, testsAttempted, accuracy, studyHours }: StatsCardsProps) {
  // Each card's title, value, footer note, and icon — mapped below into a grid.
  const cards = [
    { title: "Books Reading", value: booksRead, note: "", icon: "📚" },
    { title: "Mock Tests", value: testsAttempted, note: "", icon: "📝" },
    { title: "Accuracy", value: `${accuracy}%`, note: "", icon: "🎯" },
    { title: "Study Hours", value: studyHours, note: "Total Study Time", icon: "⏱️" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
        marginBottom: "26px",
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            background: "var(--theme-card-bg, #111827)",
            border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.07))",
            borderRadius: "18px",
            padding: "20px 22px",
            boxShadow: "0 8px 24px -8px rgba(0, 0, 0, 0.4)",
            transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--theme-accent-border, rgba(245, 158, 11, 0.35))";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 12px 28px -6px var(--theme-accent-glow, rgba(245, 158, 11, 0.15))";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--theme-border, rgba(255, 255, 255, 0.07))";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 8px 24px -8px rgba(0, 0, 0, 0.4)";
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                color: "var(--theme-text-sub, #94A3B8)",
                fontSize: "0.85rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
              }}
            >
              {card.title}
            </span>
            <span
              style={{
                fontSize: "1.35rem",
                padding: "8px",
                borderRadius: "12px",
                background: "var(--theme-hover-bg, rgba(255, 255, 255, 0.04))",
                display: "grid",
                placeItems: "center",
              }}
            >
              {card.icon}
            </span>
          </div>

          <h3
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              marginBottom: "4px",
              color: "var(--theme-text-main, #F8FAFC)",
              letterSpacing: "-0.02em",
            }}
          >
            {card.value}
          </h3>
          {card.note && (
            <p style={{ color: "var(--theme-muted-text, #64748B)", fontSize: "0.8rem", fontWeight: 500 }}>
              {card.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}