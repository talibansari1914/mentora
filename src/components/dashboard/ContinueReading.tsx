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
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "var(--theme-text-main, #F8FAFC)",
          }}
        >
          Continue Reading
        </h3>
        <Link
          href="/library"
          style={{
            color: "var(--theme-accent, #F59E0B)",
            fontSize: ".82rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          View All
        </Link>
      </div>

      {books.length === 0 ? (
        <p
          style={{
            color: "var(--theme-muted-text, #64748B)",
            fontSize: ".85rem",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          No books in progress. Open one from the Library to start.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {books.map((book) => (
            <div
              key={book.id}
              style={{
                background: "var(--theme-hover-bg, rgba(255, 255, 255, 0.03))",
                border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.07))",
                borderRadius: "14px",
                padding: "16px",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--theme-accent-border, rgba(245, 158, 11, 0.3))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--theme-border, rgba(255, 255, 255, 0.07))";
              }}
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
                    color: "var(--theme-text-main, #F8FAFC)",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {book.title}
                </h4>
                <span
                  style={{
                    color: "var(--theme-text-sub, #94A3B8)",
                    fontSize: ".8rem",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  Ch {book.chapter}/{book.totalChapters}
                </span>
              </div>

              <div
                style={{
                  height: "8px",
                  background: "var(--theme-border, #1E293B)",
                  borderRadius: "100px",
                  overflow: "hidden",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: `${book.progress}%`,
                    height: "100%",
                    background: G.grad,
                  }}
                />
              </div>

              <div
                style={{
                  textAlign: "right",
                  color: "var(--theme-text-sub, #94A3B8)",
                  fontSize: ".78rem",
                  fontWeight: 500,
                }}
              >
                {book.progress}% Complete
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}