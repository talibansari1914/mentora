"use client";

import { G } from "@/constants/colors";

interface StreakDay {
  day: string;
  done: boolean;
  today: boolean;
}

interface StudyStreakProps {
  streak: number;
}

export default function StudyStreak({ streak }: StudyStreakProps) {
  // Build the last 7 days (Mon-Sun), marking which ones count toward the streak
  // and which one is "today" (for the highlighted dot).
  const streakDays: StreakDay[] = Array.from({ length: 7 }).map((_, i) => ({
    day: ["M", "T", "W", "T", "F", "S", "S"][i],
    done: i < Math.min(streak, 7),
    today: i === (new Date().getDay() + 6) % 7,
  }));

  return (
    <section style={{ ...G.card, padding: "22px" }}>
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
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Study Streak</h3>
        <span style={{ color: "#F59E0B", fontWeight: 700 }}>🔥 {streak} Days</span>
      </div>

      <div className="streak-days-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px", gap: "4px" }}>
        {streakDays.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#64748B", fontSize: ".75rem" }}>{d.day}</span>
            <div
              className="streak-day-dot"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: d.done ? "#22C55E" : d.today ? "#F59E0B" : "#1E293B",
                display: "grid",
                placeItems: "center",
                fontSize: ".82rem",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              {d.done ? "✓" : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Progress toward a 30-day streak goal */}
      <div style={{ height: "8px", background: "#1E293B", borderRadius: "100px", overflow: "hidden" }}>
        <div
          style={{
            width: `${Math.min((streak / 30) * 100, 100)}%`,
            height: "100%",
            background: G.grad,
          }}
        />
      </div>
    </section>
  );
}