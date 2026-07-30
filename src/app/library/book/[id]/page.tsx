"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { G } from "@/constants/colors";
import { examColor } from "@/constants/library";
import { bookService } from "@/services/bookService";
import { libraryService } from "@/services/libraryService";
import { Book, LibraryProgress } from "@/types/book";
import StarRating from "@/components/library/StarRating";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = Number(params.id);

  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<LibraryProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [foundBook, allProgress] = await Promise.all([
          bookService.getBookById(bookId),
          libraryService.getAllProgress(),
        ]);
        if (!foundBook) {
          setError("Book not found.");
          return;
        }
        setBook(foundBook);
        setProgress(allProgress);
      } catch (err: any) {
        setError(err.message ?? "Could not load this book.");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId]);

  const myProgress = useMemo(
    () => progress.find((p) => Number(p.book_id) === bookId),
    [progress, bookId]
  );

  async function handleToggleFavorite() {
    if (!book) return;
    const next = !myProgress?.is_favorite;

    setProgress((prev) => {
      const existing = prev.find((p) => Number(p.book_id) === bookId);
      if (existing) {
        return prev.map((p) => (Number(p.book_id) === bookId ? { ...p, is_favorite: next } : p));
      }
      return [
        ...prev,
        { book_id: String(bookId), progress_percent: 0, is_favorite: next, is_wishlisted: false, last_opened_at: new Date().toISOString() },
      ];
    });

    try {
      await libraryService.toggleFavorite(String(bookId), next);
    } catch (err) {
      console.error("Could not save favorite:", (err as any)?.message ?? err);
    }
  }

  async function handleToggleWishlist() {
    if (!book) return;
    const next = !myProgress?.is_wishlisted;

    setProgress((prev) => {
      const existing = prev.find((p) => Number(p.book_id) === bookId);
      if (existing) {
        return prev.map((p) => (Number(p.book_id) === bookId ? { ...p, is_wishlisted: next } : p));
      }
      return [
        ...prev,
        { book_id: String(bookId), progress_percent: 0, is_favorite: false, is_wishlisted: next, last_opened_at: new Date().toISOString() },
      ];
    });

    try {
      await libraryService.toggleWishlist(String(bookId), next);
    } catch (err) {
      console.error("Could not save wishlist:", (err as any)?.message ?? err);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading...
      </div>
    );
  }

  if (error || !book) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{ ...G.card, padding: "32px", textAlign: "center", maxWidth: "420px" }}>
          <p style={{ marginBottom: "16px" }}>{error ?? "Book not found."}</p>
          <Link href="/library" style={{ color: "#F59E0B", textDecoration: "none" }}>
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const iconBtn = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    borderRadius: "10px",
    border: active ? "1px solid rgba(245,158,11,.35)" : "1px solid rgba(255,255,255,.1)",
    background: active ? "rgba(245,158,11,.1)" : "transparent",
    color: active ? "#F59E0B" : "#94A3B8",
    fontWeight: 700,
    fontSize: ".85rem",
    cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif", padding: "32px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <Link href="/library" style={{ color: "#64748B", fontSize: ".85rem", textDecoration: "none" }}>
          ← Back to Library
        </Link>

        <div style={{ display: "flex", gap: "28px", marginTop: "22px", flexWrap: "wrap" }}>
          {/* Cover */}
          <div
            style={{
              width: "220px",
              height: "290px",
              flexShrink: 0,
              borderRadius: "16px",
              background: examColor(book.exam),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "5rem",
              position: "relative",
            }}
          >
            {book.icon}
            {book.isNew && (
              <span style={{ position: "absolute", top: "14px", left: "14px", fontSize: ".68rem", fontWeight: 800, textTransform: "uppercase", background: "#080C14", color: "#F59E0B", padding: "4px 10px", borderRadius: "100px", border: "1px solid rgba(245,158,11,.4)" }}>
                New
              </span>
            )}
            {book.premium && (
              <span style={{ position: "absolute", top: "14px", right: "14px", fontSize: ".68rem", fontWeight: 800, textTransform: "uppercase", background: "rgba(99,102,241,.9)", color: "white", padding: "4px 10px", borderRadius: "100px" }}>
                Pro
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: "260px" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: ".72rem",
                fontWeight: 700,
                color: "#F59E0B",
                background: "rgba(245,158,11,.1)",
                border: "1px solid rgba(245,158,11,.15)",
                borderRadius: "100px",
                padding: "3px 10px",
                marginBottom: "12px",
              }}
            >
              {book.exam} · {book.type}
            </span>

            <h1 style={{ fontSize: "1.7rem", fontWeight: 800, marginBottom: "6px", lineHeight: 1.25 }}>{book.title}</h1>
            <p style={{ color: "#94A3B8", fontSize: ".95rem", marginBottom: "16px" }}>by {book.author}</p>

            <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "20px", flexWrap: "wrap" }}>
              <StarRating rating={book.rating} />
              <span style={{ color: "#64748B", fontSize: ".85rem" }}>{book.pages} pages</span>
              <span style={{ color: "#64748B", fontSize: ".85rem" }}>↓ {book.downloads} downloads</span>
            </div>

            {myProgress && myProgress.progress_percent > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", color: "#94A3B8", marginBottom: "6px" }}>
                  <span>Your Progress</span>
                  <span>{myProgress.progress_percent}%</span>
                </div>
                <div style={{ height: "8px", background: "rgba(255,255,255,.06)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ width: `${myProgress.progress_percent}%`, height: "100%", background: G.grad }} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                onClick={() => {
                  if (book.premium) return;
                  if (!book.pdfUrl) {
                    alert("The PDF for this book hasn't been uploaded yet.");
                    return;
                  }
                  router.push(`/library/read/${book.id}`);
                }}
                style={{
                  background: book.premium ? "rgba(99,102,241,.12)" : G.grad,
                  border: "none",
                  color: book.premium ? "#818CF8" : "#111827",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: ".9rem",
                  cursor: book.premium ? "not-allowed" : "pointer",
                }}
              >
                {book.premium
                  ? "🔒 Unlock with Pro"
                  : book.pdfUrl
                  ? myProgress && myProgress.progress_percent > 0
                    ? "Continue Reading"
                    : "Start Reading"
                  : "Coming Soon"}
              </button>

              <button onClick={handleToggleFavorite} style={iconBtn(!!myProgress?.is_favorite)}>
                {myProgress?.is_favorite ? "🔖" : "🏷️"} Bookmark
              </button>

              <button onClick={handleToggleWishlist} style={iconBtn(!!myProgress?.is_wishlisted)}>
                {myProgress?.is_wishlisted ? "💛" : "🤍"} Wishlist
              </button>
            </div>

            <Link
              href="/library/ai-tools"
              style={{
                display: "inline-block",
                color: "#F59E0B",
                fontSize: ".85rem",
                textDecoration: "none",
              }}
            >
              🤖 Explain, summarize, or quiz yourself on this book with AI Book Tools →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}