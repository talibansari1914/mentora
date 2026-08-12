"use client";

import { G } from "@/constants/colors";

interface RankCardProps {
  national: string;
  percentile: string;
  stateRank: string;
  cityRank: string;
}

export default function RankCard({ national, percentile, stateRank, cityRank }: RankCardProps) {
  return (
    <section style={{ ...G.card, padding: "22px" }}>
      <h3
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          marginBottom: "18px",
          color: "var(--theme-text-main, #F8FAFC)",
        }}
      >
        National Ranking
      </h3>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "2.4rem", fontWeight: 800, ...G.gradText }}>#{national}</div>
        <p style={{ color: "var(--theme-text-sub, #94A3B8)", marginTop: "6px", fontSize: "0.88rem" }}>
          {percentile}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div
          style={{
            background: "var(--theme-hover-bg, rgba(255, 255, 255, 0.03))",
            border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.05))",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div style={{ color: "var(--theme-muted-text, #64748B)", fontSize: ".78rem", fontWeight: 500 }}>
            State Rank
          </div>
          <div
            style={{
              marginTop: "6px",
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "var(--theme-text-main, #F8FAFC)",
            }}
          >
            #{stateRank}
          </div>
        </div>

        <div
          style={{
            background: "var(--theme-hover-bg, rgba(255, 255, 255, 0.03))",
            border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.05))",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div style={{ color: "var(--theme-muted-text, #64748B)", fontSize: ".78rem", fontWeight: 500 }}>
            City Rank
          </div>
          <div
            style={{
              marginTop: "6px",
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "var(--theme-text-main, #F8FAFC)",
            }}
          >
            #{cityRank}
          </div>
        </div>
      </div>
    </section>
  );
}