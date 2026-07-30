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
      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "18px" }}>
        National Ranking
      </h3>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "2.4rem", fontWeight: 800, ...G.gradText }}>#{national}</div>
        <p style={{ color: "#94A3B8", marginTop: "6px" }}>{percentile}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ background: "#0F172A", borderRadius: "12px", padding: "14px" }}>
          <div style={{ color: "#64748B", fontSize: ".78rem" }}>State Rank</div>
          <div style={{ marginTop: "6px", fontWeight: 700, fontSize: "1.2rem" }}>#{stateRank}</div>
        </div>

        <div style={{ background: "#0F172A", borderRadius: "12px", padding: "14px" }}>
          <div style={{ color: "#64748B", fontSize: ".78rem" }}>City Rank</div>
          <div style={{ marginTop: "6px", fontWeight: 700, fontSize: "1.2rem" }}>#{cityRank}</div>
        </div>
      </div>
    </section>
  );
}