"use client";

import { useRouter } from "next/navigation";
import { G } from "@/constants/colors";
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
        ...G.card,
        padding: 0,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "transform .2s, border-color .2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.06)";
      }}
      // Tapping anywhere on the card (except the action buttons, which stop
      // propagation) opens the full Book Detail page.
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
        }}
      >
        {book.icon}

        {book.isNew && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              fontSize: "0.6rem",
              fontWeight: 800,
              textTransform: "uppercase",
              background: "#080C14",
              color: "#F59E0B",
              padding: "3px 9px",
              borderRadius: "100px",
              border: "1px solid rgba(245,158,11,.4)",
            }}
          >
            New
          </span>
        )}

        {book.premium && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: book.isNew ? "52px" : "10px",
              fontSize: "0.6rem",
              fontWeight: 800,
              textTransform: "uppercase",
              background: "rgba(99,102,241,.9)",
              color: "white",
              padding: "3px 9px",
              borderRadius: "100px",
            }}
          >
            Pro
          </span>
        )}

        <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "6px" }}>
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(book.id);
              }}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(8,12,20,.6)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                color: isWishlisted ? "#FBBF24" : "white",
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
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(8,12,20,.6)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              color: isFavorite ? "#F59E0B" : "white",
            }}
          >
            {isFavorite ? "🔖" : "🏷️"}
          </button>
        </div>

        {/* Continue Reading progress bar, only shown when progress is passed in */}
        {typeof progressPercent === "number" && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "rgba(0,0,0,.3)",
            }}
          >
            <div style={{ width: `${progressPercent}%`, height: "100%", background: "#F59E0B" }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <div>
          <p
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              marginBottom: "3px",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}
          >
            {book.title}
          </p>
          <p style={{ fontSize: "0.74rem", color: "#64748B" }}>{book.author}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#F59E0B",
              background: "rgba(245,158,11,.1)",
              border: "1px solid rgba(245,158,11,.15)",
              borderRadius: "100px",
              padding: "2px 8px",
            }}
          >
            {book.exam}
          </span>
          <span style={{ fontSize: "0.62rem", color: "#64748B" }}>{book.pages}p</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "6px" }}>
          <StarRating rating={book.rating} />
          <span style={{ fontSize: "0.68rem", color: "#475569" }}>↓ {book.downloads}</span>
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
            marginTop: "6px",
            padding: "9px",
            borderRadius: "9px",
            border: "none",
            cursor: book.premium ? "not-allowed" : "pointer",
            background: book.premium ? "rgba(99,102,241,.12)" : "rgba(245,158,11,.1)",
            color: book.premium ? "#818CF8" : "#F59E0B",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          {book.premium ? "🔒 Unlock with Pro" : book.pdfUrl ? "Read Now" : "Read Now (Coming Soon)"}
        </button>
      </div>
    </div>
  );
}