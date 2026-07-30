"use client";

import Link from "next/link";
import { G } from "@/constants/colors";

interface WeakTopic {
  topic: string;
  pct: number;
  level: "high" | "mid" | "low" | string;
}

interface FocusAreasProps {
  weakTopics: WeakTopic[];
}

// Maps an accuracy "level" to a status color — green (strong), amber (medium), red (weak).
function scoreColor(level: string) {
  if (level === "high") return "#22C55E";
  if (level === "mid") return "#F59E0B";
  return "#EF4444";
}

export default function FocusAreas({ weakTopics }: FocusAreasProps) {
  return (
    <section style={{ ...G.card, padding: "22px", marginTop: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Focus Areas</h3>
        <Link href="/analytics" style={{ color: "#F59E0B", textDecoration: "none", fontSize: ".82rem" }}>
          View Details
        </Link>
      </div>

      {weakTopics.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: ".85rem", textAlign: "center", padding: "20px 0" }}>
          Attempt a few tests to see your focus areas here.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {weakTopics.map((item, index) => (
            <div key={index}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.topic}
                </span>
                <span style={{ color: scoreColor(item.level), fontWeight: 700, flexShrink: 0 }}>{item.pct}%</span>
              </div>

              <div style={{ height: "8px", background: "#1E293B", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${item.pct}%`,
                    height: "100%",
                    background: scoreColor(item.level),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}