"use client";

import { G } from "@/constants/colors";

interface Task {
  id?: string;
  title: string;
  done: boolean;
  subject?: string;
  time?: string;
}

interface TodayPlanProps {
  tasks: Task[];
  examFallback?: string;
}

export default function TodayPlan({ tasks = [], examFallback }: TodayPlanProps) {
  const completedCount = tasks.filter((t) => t.done).length;

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
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--theme-text-main, #F8FAFC)" }}>
            Today's Plan
          </h3>
          {examFallback && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--theme-accent, #F59E0B)",
                fontWeight: 600,
                marginTop: "2px",
              }}
            >
              Target Exam: {examFallback}
            </p>
          )}
        </div>

        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--theme-text-sub, #94A3B8)",
            background: "var(--theme-hover-bg, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.06))",
            padding: "4px 12px",
            borderRadius: "20px",
            fontWeight: 600,
          }}
        >
          {completedCount}/{tasks.length} Completed
        </span>
      </div>

      {tasks.length === 0 ? (
        <p
          style={{
            color: "var(--theme-muted-text, #64748B)",
            fontSize: ".85rem",
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          No study tasks scheduled for today ({examFallback || "Exam"}).
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tasks.map((task, idx) => (
            <div
              key={task.id || idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "var(--theme-hover-bg, rgba(255, 255, 255, 0.03))",
                border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.05))",
                transition: "all 0.18s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    border: task.done
                      ? "none"
                      : "2px solid var(--theme-muted-text, #64748B)",
                    background: task.done
                      ? "var(--theme-accent, #F59E0B)"
                      : "transparent",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--theme-accent-text, #000000)",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {task.done && "✓"}
                </div>
                <span
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 500,
                    color: task.done
                      ? "var(--theme-muted-text, #64748B)"
                      : "var(--theme-text-main, #F8FAFC)",
                    textDecoration: task.done ? "line-through" : "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {task.title}
                </span>
              </div>

              {task.subject && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--theme-text-sub, #94A3B8)",
                    background: "var(--theme-card-bg, #111827)",
                    border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.05))",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {task.subject}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}