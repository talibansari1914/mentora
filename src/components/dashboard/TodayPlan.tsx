"use client";

import { G } from "@/constants/colors";

interface Task {
  id?: string;
  title: string;
  duration?: number;
  subject?: string;
  done: boolean;
}

interface TodayPlanProps {
  tasks: Task[];
  examFallback: string;
}

export default function TodayPlan({ tasks, examFallback }: TodayPlanProps) {
  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <section style={{ ...G.card, padding: "22px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Today's Plan</h3>
        <span style={{ color: "#64748B", fontSize: ".82rem" }}>
          {completedCount}/{tasks.length} Completed
        </span>
      </div>

      {tasks.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: ".85rem", textAlign: "center", padding: "20px 0" }}>
          No tasks planned for today yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {tasks.map((t, i) => (
            <div
              key={t.id ?? i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#0F172A",
                border: "1px solid rgba(255,255,255,.05)",
                transition: "border-color .15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,.2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.05)")}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4
                  style={{
                    fontWeight: 600,
                    marginBottom: "6px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.title}
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    color: "#64748B",
                    fontSize: ".8rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span>{t.duration ?? 0} min</span>
                  <span>•</span>
                  <span>{t.subject ?? examFallback}</span>
                </div>
              </div>

              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: t.done ? "#22C55E" : "#1E293B",
                  color: "white",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {t.done ? "✓" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}