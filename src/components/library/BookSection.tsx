"use client";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} style={{ color: "#F59E0B", fontSize: ".82rem", textDecoration: "none" }}>
            View All →
          </Link>
        )}
      </div>

      {books.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: ".85rem" }}>{emptyMessage}</p>
      ) : (
        // Horizontal scroll row — CSS-only, no extra library needed.
        <div
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          {books.map((book) => (
            <div key={book.id} style={{ minWidth: "200px", maxWidth: "200px", flexShrink: 0 }}>
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