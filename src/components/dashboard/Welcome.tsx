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
        ...G.card,
        padding: "24px",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "24px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0, flex: "1 1 260px" }}>
        <p style={{ color: "#94A3B8", fontSize: ".9rem", marginBottom: "8px" }}>Welcome back,</p>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            marginBottom: "10px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </h2>
        <p style={{ color: "#64748B", fontSize: ".92rem", lineHeight: 1.6, maxWidth: "620px" }}>
          Stay consistent today. Complete your study tasks, improve your weak subjects and keep
          your streak alive.
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "14px",
            background: "rgba(245,158,11,.08)",
            border: "1px solid rgba(245,158,11,.15)",
            minWidth: "130px",
          }}
        >
          <div style={{ fontSize: ".78rem", color: "#94A3B8", marginBottom: "4px" }}>
            Current Streak
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F59E0B" }}>🔥 {streak}</div>
        </div>

        <div
          style={{
            padding: "14px 18px",
            borderRadius: "14px",
            background: "rgba(34,197,94,.08)",
            border: "1px solid rgba(34,197,94,.15)",
            minWidth: "130px",
          }}
        >
          <div style={{ fontSize: ".78rem", color: "#94A3B8", marginBottom: "4px" }}>
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