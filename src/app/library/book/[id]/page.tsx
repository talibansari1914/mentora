"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { examColor } from "@/constants/library";
import { bookService } from "@/services/bookService";
import { libraryService } from "@/services/libraryService";
import { Book, LibraryProgress } from "@/types/book";
import StarRating from "@/components/library/StarRating";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = Number(params.id);

  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<LibraryProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [foundBook, allProgress] = await Promise.all([
          bookService.getBookById(bookId),
          libraryService.getAllProgress(),
        ]);
        if (cancelled) return;
        if (!foundBook) {
          setError("Book not found.");
          return;
        }
        setBook(foundBook);
        setProgress(allProgress);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load this book."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
        {
          book_id: String(bookId),
          progress_percent: 0,
          is_favorite: next,
          is_wishlisted: false,
          last_opened_at: new Date().toISOString(),
        },
      ];
    });

    try {
      await libraryService.toggleFavorite(String(bookId), next);
    } catch (err) {
      console.error("Could not save favorite:", getErrorMessage(err));
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
        {
          book_id: String(bookId),
          progress_percent: 0,
          is_favorite: false,
          is_wishlisted: next,
          last_opened_at: new Date().toISOString(),
        },
      ];
    });

    try {
      await libraryService.toggleWishlist(String(bookId), next);
    } catch (err) {
      console.error("Could not save wishlist:", getErrorMessage(err));
    }
  }

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no localStorage polling, no interval — it stays perfectly
  // in sync and reacts instantly to the toggle.
  const themeStyles = {
    bg: "var(--theme-bg-main, #080C14)",
    color: "var(--theme-text-main, #F8FAFC)",
    subText: "var(--theme-text-sub, #94A3B8)",
    cardBg: "var(--theme-card-bg, #111827)",
    cardBorder: "var(--theme-border, rgba(255, 255, 255, 0.08))",
    btnBg: "var(--theme-card-bg, #111827)",
    btnBorder: "1px solid var(--theme-border, rgba(255, 255, 255, 0.12))",
    progressTrack: "var(--theme-hover-bg, rgba(255, 255, 255, 0.1))",
  };

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: `1px solid ${themeStyles.cardBorder}`,
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: themeStyles.bg,
          color: themeStyles.subText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          transition: "background 0.3s, color 0.3s",
        }}
      >
        Loading...
      </div>
    );
  }

  if (error || !book) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: themeStyles.bg,
          color: themeStyles.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          transition: "background 0.3s, color 0.3s",
        }}
      >
        <div style={{ ...cardStyle, padding: "32px", textAlign: "center", maxWidth: "420px" }}>
          <p style={{ marginBottom: "16px", color: themeStyles.subText, fontWeight: 600 }}>
            {error ?? "Book not found."}
          </p>
          <Link href="/library" style={{ color: "var(--theme-accent, #D97706)", textDecoration: "none", fontWeight: 700 }}>
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
    border: active ? "1px solid var(--theme-accent-border, #FCD34D)" : themeStyles.btnBorder,
    background: active ? "var(--theme-accent-soft, #FEF3C7)" : themeStyles.btnBg,
    color: active ? "var(--theme-accent, #D97706)" : themeStyles.color,
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    transition: "all 0.15s ease",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeStyles.bg,
        color: themeStyles.color,
        fontFamily: "'DM Sans', sans-serif",
        padding: "32px 20px",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <BackToDashboardLink href="/library" label="Back to Library" />

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
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            {book.icon}
            {book.isNew && (
              <span
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background: "#080C14",
                  color: "#F59E0B",
                  padding: "4px 10px",
                  borderRadius: "100px",
                }}
              >
                New
              </span>
            )}
            {book.premium && (
              <span
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background: "#6366F1",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "100px",
                }}
              >
                Pro
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: "260px" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "var(--theme-accent, #D97706)",
                background: "var(--theme-accent-soft, #FEF3C7)",
                border: "1px solid var(--theme-accent-border, #FDE68A)",
                borderRadius: "100px",
                padding: "3px 10px",
                marginBottom: "12px",
              }}
            >
              {book.exam} · {book.type}
            </span>

            <h1
              style={{
                fontSize: "1.7rem",
                fontWeight: 800,
                color: themeStyles.color,
                marginBottom: "6px",
                lineHeight: 1.25,
                transition: "color 0.3s",
              }}
            >
              {book.title}
            </h1>
            <p style={{ color: themeStyles.subText, fontSize: "0.95rem", marginBottom: "16px", fontWeight: 500, transition: "color 0.3s" }}>
              by {book.author}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              <StarRating rating={book.rating} />
              <span style={{ color: themeStyles.subText, fontSize: "0.85rem", fontWeight: 600 }}>
                {book.pages} pages
              </span>
              <span style={{ color: themeStyles.subText, fontSize: "0.85rem", fontWeight: 600 }}>
                ↓ {book.downloads} downloads
              </span>
            </div>

            {myProgress && myProgress.progress_percent > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    color: themeStyles.subText,
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  <span>Your Progress</span>
                  <span>{myProgress.progress_percent}%</span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: themeStyles.progressTrack,
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${myProgress.progress_percent}%`,
                      height: "100%",
                      background: "var(--theme-accent, #F59E0B)",
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
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
                  background: book.premium ? "rgba(99, 102, 241, 0.15)" : "var(--theme-accent, #F59E0B)",
                  border: "none",
                  color: book.premium ? "#818CF8" : "var(--theme-accent-text, #080C14)",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  cursor: book.premium ? "not-allowed" : "pointer",
                  boxShadow: book.premium ? "none" : "0 2px 6px var(--theme-accent-glow, rgba(245, 158, 11, 0.25))",
                  transition: "all 0.15s ease",
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
                color: "var(--theme-accent, #D97706)",
                fontSize: "0.85rem",
                fontWeight: 700,
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