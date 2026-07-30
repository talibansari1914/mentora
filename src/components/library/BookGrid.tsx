"use client";

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
          padding: "60px 20px",
          color: "#64748B",
          fontSize: ".9rem",
          border: "1px dashed rgba(255,255,255,.08)",
          borderRadius: "16px",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "18px" }}>
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