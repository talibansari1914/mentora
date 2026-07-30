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
        gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
        gap: "18px",
        marginBottom: "26px",
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          style={{ ...G.card, padding: "20px", transition: "transform .18s, border-color .18s" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.06)";
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <span style={{ color: "#94A3B8", fontSize: ".84rem" }}>{card.title}</span>
            <span style={{ fontSize: "1.4rem" }}>{card.icon}</span>
          </div>

          <h3 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "6px" }}>{card.value}</h3>
          {card.note && <p style={{ color: "#64748B", fontSize: ".82rem" }}>{card.note}</p>}
        </div>
      ))}
    </div>
  );
}