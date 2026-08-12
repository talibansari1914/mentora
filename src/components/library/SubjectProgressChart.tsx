"use client";

import React from "react";
import { examColor } from "@/constants/library";

interface SubjectProgress {
  exam: string;
  avgProgress: number;
  bookCount: number;
}

export default function SubjectProgressChart({ data }: { data: SubjectProgress[] }) {
  return (
    <div
      style={{
        background: "var(--theme-card-bg, #FFFFFF)",
        border: "1px solid var(--theme-border, #E2E8F0)",
        borderRadius: "16px",
        padding: "22px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          fontWeight: 800,
          fontSize: "1.05rem",
          color: "var(--theme-text-main, #0F172A)",
          marginBottom: "4px",
          margin: "0 0 4px 0",
        }}
      >
        Subject-wise Progress
      </h3>
      <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.82rem", marginBottom: "18px", marginTop: 0 }}>
        Average progress across all books in each category (untouched books count as 0%).
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {data.map((item) => (
          <div key={item.exam}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--theme-text-main, #0F172A)" }}>
                {item.exam}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--theme-text-sub, #64748B)", fontWeight: 600 }}>
                {item.avgProgress}% · {item.bookCount} book{item.bookCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div
              style={{
                background: "var(--theme-hover-bg, #F1F5F9)",
                borderRadius: "999px",
                height: "10px",
                overflow: "hidden",
                border: "1px solid var(--theme-border, #E2E8F0)",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, item.avgProgress))}%`,
                  height: "100%",
                  background: examColor(item.exam),
                  borderRadius: "999px",
                  transition: "width 0.4s ease-out",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}