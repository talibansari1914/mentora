"use client";

import Link from "next/link";
import { G } from "@/constants/colors";

interface Book {
  id: string;
  title: string;
  chapter: number;
  totalChapters: number;
  progress: number;
}

interface ContinueReadingProps {
  books: Book[];
}

export default function ContinueReading({ books }: ContinueReadingProps) {
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
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Continue Reading</h3>
        <Link href="/library" style={{ color: "#F59E0B", fontSize: ".82rem", textDecoration: "none" }}>
          View All
        </Link>
      </div>

      {books.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: ".85rem", textAlign: "center", padding: "20px 0" }}>
          No books in progress. Open one from the Library to start.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {books.map((book) => (
            <div
              key={book.id}
              style={{
                background: "#0F172A",
                border: "1px solid rgba(255,255,255,.05)",
                borderRadius: "14px",
                padding: "16px",
                transition: "border-color .15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,.2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.05)")}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                  gap: "10px",
                }}
              >
                <h4
                  style={{
                    fontWeight: 700,
                    fontSize: ".95rem",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {book.title}
                </h4>
                <span style={{ color: "#64748B", fontSize: ".8rem", flexShrink: 0 }}>
                  Ch {book.chapter}/{book.totalChapters}
                </span>
              </div>

              <div
                style={{
                  height: "8px",
                  background: "#1E293B",
                  borderRadius: "100px",
                  overflow: "hidden",
                  marginBottom: "8px",
                }}
              >
                <div style={{ width: `${book.progress}%`, height: "100%", background: G.grad }} />
              </div>

              <div style={{ textAlign: "right", color: "#94A3B8", fontSize: ".78rem" }}>
                {book.progress}% Complete
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}