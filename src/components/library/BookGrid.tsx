"use client";

import React from "react";
import { Book } from "@/types/book";
import BookCard from "./BookCard";

interface BookGridProps {
  books: Book[];
  favorites: number[];
  onToggleFavorite: (bookId: number) => void;
  wishlist?: number[];
  onToggleWishlist?: (bookId: number) => void;
  progressMap?: Record<number, number>;
  emptyMessage: string;
}

export default function BookGrid({
  books,
  favorites,
  onToggleFavorite,
  wishlist,
  onToggleWishlist,
  progressMap,
  emptyMessage,
}: BookGridProps) {
  if (books.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px 24px",
          color: "var(--theme-text-sub, #64748B)",
          fontSize: "0.95rem",
          fontWeight: 500,
          background: "var(--theme-card-bg, #FFFFFF)",
          border: "2px dashed var(--theme-border, #E2E8F0)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          margin: "12px 0",
        }}
      >
        <span style={{ fontSize: "2.2rem", marginBottom: "4px" }}>📚</span>
        <p style={{ margin: 0, color: "var(--theme-text-main, #475569)", fontWeight: 600 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: "20px",
        width: "100%",
      }}
    >
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          isFavorite={favorites.includes(book.id)}
          onToggleFavorite={onToggleFavorite}
          isWishlisted={wishlist?.includes(book.id)}
          onToggleWishlist={onToggleWishlist}
          progressPercent={progressMap?.[book.id]}
        />
      ))}
    </div>
  );
}