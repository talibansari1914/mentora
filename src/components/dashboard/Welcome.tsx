"use client";

import { G } from "@/constants/colors";

interface WelcomeProps {
  name: string;
  streak: number;
  nationalRank: string;
}

export default function Welcome({ name, streak, nationalRank }: WelcomeProps) {
  return (
    <section
      className="dashboard-welcome"
      style={{
        background: "var(--theme-card-bg, #111827)",
        border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.07))",
        borderRadius: "20px",
        padding: "24px",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "24px",
        flexWrap: "wrap",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div style={{ minWidth: 0, flex: "1 1 260px" }}>
        <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: "0.9rem", marginBottom: "6px", fontWeight: 500 }}>
          Welcome back,
        </p>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            marginBottom: "8px",
            color: "var(--theme-text-main, #F8FAFC)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </h2>
        <p
          style={{
            color: "var(--theme-muted-text, #64748B)",
            fontSize: "0.92rem",
            lineHeight: 1.6,
            maxWidth: "620px",
          }}
        >
          Stay consistent today. Complete your study tasks, improve your weak subjects and keep
          your streak alive.
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", width: "fit-content" }}>
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "16px",
            background: "var(--theme-accent-soft, rgba(245, 158, 11, 0.08))",
            border: "1px solid var(--theme-accent-border, rgba(245, 158, 11, 0.2))",
            minWidth: "135px",
            flex: "1 1 auto",
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "var(--theme-text-sub, #94A3B8)", marginBottom: "4px", fontWeight: 600 }}>
            Current Streak
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--theme-accent, #F59E0B)" }}>
            🔥 {streak}
          </div>
        </div>

        <div
          style={{
            padding: "14px 20px",
            borderRadius: "16px",
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            minWidth: "135px",
            flex: "1 1 auto",
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "var(--theme-text-sub, #94A3B8)", marginBottom: "4px", fontWeight: 600 }}>
            National Rank
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#22C55E" }}>
            #{nationalRank}
          </div>
        </div>
      </div>
    </section>
  );
}