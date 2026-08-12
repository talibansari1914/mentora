"use client";

import React from "react";
import Link from "next/link";
import { Book } from "@/types/book";
import BookCard from "./BookCard";

interface BookSectionProps {
  title: string;
  books: Book[];
  favorites: number[];
  onToggleFavorite: (bookId: number) => void;
  wishlist?: number[];
  onToggleWishlist?: (bookId: number) => void;
  viewAllHref?: string;
  progressMap?: Record<number, number>; // bookId -> percent, used only by "Continue Reading"
  emptyMessage?: string;
}

export default function BookSection({
  title,
  books,
  favorites,
  onToggleFavorite,
  wishlist,
  onToggleWishlist,
  viewAllHref,
  progressMap,
  emptyMessage,
}: BookSectionProps) {
  if (books.length === 0 && !emptyMessage) return null;

  return (
    <section style={{ marginBottom: "36px" }}>
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            color: "var(--theme-text-main, #0F172A)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            style={{
              color: "var(--theme-accent, #B45309)",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.15s ease",
            }}
          >
            View All →
          </Link>
        )}
      </div>

      {/* Body Content */}
      {books.length === 0 ? (
        <div
          style={{
            background: "var(--theme-card-bg, #FFFFFF)",
            border: "1px dashed var(--theme-border, #E2E8F0)",
            borderRadius: "12px",
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--theme-text-sub, #64748B)",
            fontSize: "0.88rem",
            fontWeight: 500,
          }}
        >
          {emptyMessage}
        </div>
      ) : (
        /* Horizontal scroll row — Touch-friendly & Responsive */
        <div
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            paddingTop: "4px",
            paddingBottom: "12px",
            paddingLeft: "2px",
            paddingRight: "2px",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
          }}
        >
          {books.map((book) => (
            <div
              key={book.id}
              style={{
                minWidth: "185px",
                maxWidth: "200px",
                flexShrink: 0,
              }}
            >
              <BookCard
                book={book}
                isFavorite={favorites.includes(book.id)}
                onToggleFavorite={onToggleFavorite}
                isWishlisted={wishlist?.includes(book.id)}
                onToggleWishlist={onToggleWishlist}
                progressPercent={progressMap?.[book.id]}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}