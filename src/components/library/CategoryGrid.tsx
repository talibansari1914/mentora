"use client";

import React from "react";
import { examColor } from "@/constants/library";
import { Book } from "@/types/book";

interface CategoryGridProps {
  exams: string[]; // e.g. ["UPSC","JEE","NEET","SSC","Engineering"] — "All" excluded by the caller
  books: Book[];
  onSelectCategory: (exam: string) => void;
}

export default function CategoryGrid({ exams, books, onSelectCategory }: CategoryGridProps) {
  return (
    <section style={{ marginBottom: "36px" }}>
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: 800,
          color: "var(--theme-text-main, #0F172A)",
          marginBottom: "16px",
          letterSpacing: "-0.01em",
          margin: "0 0 16px 0",
        }}
      >
        Browse by Category
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "14px",
        }}
      >
        {exams.map((exam) => {
          const count = books.filter((b) => b.exam === exam).length;
          return (
            <button
              key={exam}
              onClick={() => onSelectCategory(exam)}
              style={{
                border: "1px solid rgba(0, 0, 0, 0.05)",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "16px",
                padding: "18px 16px",
                background: examColor(exam),
                color: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "105px",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.08)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(-3px)";
                el.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.08)";
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  lineHeight: "1.25",
                  textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                }}
              >
                {exam}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: "rgba(0, 0, 0, 0.18)",
                  backdropFilter: "blur(4px)",
                  padding: "3px 10px",
                  borderRadius: "100px",
                  alignSelf: "flex-start",
                  color: "#FFFFFF",
                  marginTop: "12px",
                }}
              >
                {count} {count === 1 ? "resource" : "resources"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}