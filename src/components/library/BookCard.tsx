"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { examColor } from "@/constants/library";
import { Book } from "@/types/book";
import StarRating from "./StarRating";

interface BookCardProps {
  book: Book;
  isFavorite: boolean;
  onToggleFavorite: (bookId: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (bookId: number) => void;
  progressPercent?: number; // shown as a thin bar when the book is in "Continue Reading"
}

export default function BookCard({
  book,
  isFavorite,
  onToggleFavorite,
  isWishlisted,
  onToggleWishlist,
  progressPercent,
}: BookCardProps) {
  const router = useRouter();

  return (
    <div
      style={{
        background: "var(--theme-card-bg, #FFFFFF)",
        border: "1px solid var(--theme-border, #E2E8F0)",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-4px)";
        el.style.borderColor = "var(--theme-accent, #F59E0B)";
        el.style.boxShadow = "0 10px 20px -5px rgba(245, 158, 11, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.borderColor = "var(--theme-border, #E2E8F0)";
        el.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.05)";
      }}
      onClick={() => router.push(`/library/book/${book.id}`)}
    >
      {/* Cover */}
      <div
        style={{
          position: "relative",
          height: "140px",
          background: examColor(book.exam),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.8rem",
          userSelect: "none",
        }}
      >
        {book.icon}

        {/* Badges */}
        <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", gap: "6px" }}>
          {book.isNew && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 800,
                textTransform: "uppercase",
                background: "#0F172A",
                color: "#F59E0B",
                padding: "3px 9px",
                borderRadius: "100px",
                border: "1px solid #F59E0B",
                letterSpacing: "0.05em",
              }}
            >
              New
            </span>
          )}

          {book.premium && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 800,
                textTransform: "uppercase",
                background: "#4F46E5",
                color: "#FFFFFF",
                padding: "3px 9px",
                borderRadius: "100px",
                letterSpacing: "0.05em",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              Pro
            </span>
          )}
        </div>

        {/* Quick Action Overlay Buttons */}
        <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "6px" }}>
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(book.id);
              }}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                transition: "transform 0.1s ease",
              }}
            >
              {isWishlisted ? "💛" : "🤍"}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(book.id);
            }}
            title={isFavorite ? "Remove bookmark" : "Bookmark this book"}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
              transition: "transform 0.1s ease",
            }}
          >
            {isFavorite ? "🔖" : "🏷️"}
          </button>
        </div>

        {/* Continue Reading progress bar */}
        {typeof progressPercent === "number" && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "5px",
              background: "rgba(15, 23, 42, 0.15)",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                height: "100%",
                background: "var(--theme-accent, #F59E0B)",
                borderRadius: "0 2px 2px 0",
              }}
            />
          </div>
        )}
      </div>

      {/* Info Body */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        <div>
          <p
            style={{
              fontSize: "0.92rem",
              fontWeight: 700,
              color: "var(--theme-text-main, #0F172A)",
              marginBottom: "4px",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {book.title}
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--theme-text-sub, #64748B)", fontWeight: 500, margin: 0 }}>
            {book.author}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#B45309",
              background: "#FEF3C7",
              border: "1px solid #FDE68A",
              borderRadius: "100px",
              padding: "2px 8px",
            }}
          >
            {book.exam}
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--theme-text-sub, #64748B)", fontWeight: 500 }}>
            {book.pages} pages
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "4px",
          }}
        >
          <StarRating rating={book.rating} />
          <span style={{ fontSize: "0.72rem", color: "var(--theme-text-sub, #64748B)", fontWeight: 600 }}>
            ↓ {book.downloads.toLocaleString()}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (book.premium) return;
            if (!book.pdfUrl) {
              alert("The PDF for this book hasn't been uploaded yet.");
              return;
            }
            router.push(`/library/read/${book.id}`);
          }}
          style={{
            marginTop: "4px",
            padding: "10px",
            borderRadius: "10px",
            border: book.premium ? "1px solid #C7D2FE" : "1px solid #FDE68A",
            cursor: book.premium ? "not-allowed" : "pointer",
            background: book.premium ? "#EEF2FF" : "#FEF3C7",
            color: book.premium ? "#4338CA" : "#B45309",
            fontSize: "0.82rem",
            fontWeight: 700,
            textAlign: "center",
            transition: "all 0.15s ease",
          }}
        >
          {book.premium ? "🔒 Unlock with Pro" : book.pdfUrl ? "Read Now" : "Read Now (Coming Soon)"}
        </button>
      </div>
    </div>
  );
}