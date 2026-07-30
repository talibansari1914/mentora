"use client";

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
      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "16px" }}>Browse by Category</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
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
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "16px",
                padding: "20px 16px",
                background: examColor(exam),
                color: "white",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "100px",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "1rem" }}>{exam}</span>
              <span style={{ fontSize: ".78rem", opacity: 0.85 }}>{count} resources</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}