"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { bookService } from "@/services/bookService";
import { libraryService } from "@/services/libraryService";
import { Book } from "@/types/book";
import { getErrorMessage } from "@/lib/errors";

// Minimal structural type for the pdf.js page object passed into
// handleFirstPageMeasured — only the one method this file actually calls.
interface PDFPageLike {
  getViewport(params: { scale: number }): { height: number; width: number };
}

// react-pdf worker setup — bundled locally via the bundler (instead of
// pointing at an external CDN like unpkg.com) so the reader doesn't depend
// on a third-party host being reachable. If that CDN is ever slow, blocked,
// or down, the entire book reader would fail with it.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Key used to hand off extracted page text to the AI Book Tools page.
const AI_HANDOFF_KEY = "mentora_book_tools_prefill";
const RENDER_BUFFER = 2;

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = Number(params.id);

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [pageInput, setPageInput] = useState("1");
  const [extracting, setExtracting] = useState(false);

  const [estimatedPageHeight, setEstimatedPageHeight] = useState(1000);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageElRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const hasResumedRef = useRef(false);
  const isJumpingRef = useRef(false);

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
          setLoadError("Book not found.");
          return;
        }

        setBook(foundBook);

        const existing = allProgress.find((p) => Number(p.book_id) === bookId);
        if (existing) {
          (window as unknown as Record<string, number>).__mentora_resume_percent = existing.progress_percent;
        }
      } catch (err: unknown) {
        if (!cancelled) setLoadError(getErrorMessage(err, "Could not load this book."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  function handleDocumentLoad({ numPages: total }: { numPages: number }) {
    setNumPages(total);

    if (!hasResumedRef.current) {
      const resumePercent = (window as unknown as Record<string, number>).__mentora_resume_percent ?? 0;
      if (resumePercent > 0) {
        const resumePage = Math.max(1, Math.round((resumePercent / 100) * total));
        setPageNumber(resumePage);
        setPageInput(String(resumePage));
      }
      hasResumedRef.current = true;
    }
  }

  useEffect(() => {
    if (!book || numPages === 0) return;

    const timeout = setTimeout(() => {
      const percent = Math.round((pageNumber / numPages) * 100);
      libraryService.recordOpen(String(book.id), percent).catch((err) => {
        console.error("Could not save reading progress:", err?.message ?? err);
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [pageNumber, numPages, book]);

  const renderStart = Math.max(1, pageNumber - RENDER_BUFFER);
  const renderEnd = Math.min(numPages || 1, pageNumber + RENDER_BUFFER);

  const allPageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, i) => i + 1),
    [numPages]
  );

  useEffect(() => {
    if (!numPages || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isJumpingRef.current) return;

        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting && (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio)) {
            bestEntry = entry;
          }
        }

        if (bestEntry) {
          const page = Number((bestEntry.target as HTMLElement).dataset.page);
          if (page) {
            setPageNumber((prev) => (prev === page ? prev : page));
            setPageInput((prev) => (prev === String(page) ? prev : String(page)));
          }
        }
      },
      { root: containerRef.current, threshold: 0.5 }
    );

    Object.values(pageElRefs.current).forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, [numPages, renderStart, renderEnd]);

  function goToPage(page: number) {
    const clamped = Math.min(Math.max(page, 1), numPages || 1);

    isJumpingRef.current = true;
    setPageNumber(clamped);
    setPageInput(String(clamped));

    setTimeout(() => {
      pageElRefs.current[clamped]?.scrollIntoView({ block: "start" });
      setTimeout(() => {
        isJumpingRef.current = false;
      }, 400);
    }, 50);
  }

  function handleFirstPageMeasured(page: PDFPageLike) {
    try {
      const viewport = page.getViewport({ scale });
      setEstimatedPageHeight(viewport.height);
    } catch {
      // Non-fatal
    }
  }

  async function handleAskAI() {
    if (!book?.pdfUrl) return;

    setExtracting(true);
    try {
      const loadingTask = pdfjs.getDocument(book.pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");

      sessionStorage.setItem(AI_HANDOFF_KEY, pageText);
      router.push("/library/ai-tools");
    } catch (err) {
      console.error("Could not extract page text:", err);
    } finally {
      setExtracting(false);
    }
  }

  // UI now reads directly from the global CSS variables (globals.css) that
  // the dashboard's ThemeToggle sets via data-theme on <html>. No local
  // isDark state, no localStorage polling, no interval — one less thing
  // running in the background on an already render-heavy PDF page.
  const themeStyles = {
    bg: "var(--theme-bg-main, #080C14)",
    color: "var(--theme-text-main, #F8FAFC)",
    subText: "var(--theme-text-sub, #94A3B8)",
    toolbarBg: "var(--theme-card-bg, rgba(8, 12, 20, 0.95))",
    toolbarBorder: "var(--theme-border, rgba(255, 255, 255, 0.08))",
    btnBg: "var(--theme-card-bg, #111827)",
    btnBorder: "1px solid var(--theme-border, rgba(255, 255, 255, 0.12))",
    cardBg: "var(--theme-card-bg, #111827)",
    cardBorder: "var(--theme-border, rgba(255, 255, 255, 0.08))",
  };

  const iconBtn: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: themeStyles.btnBorder,
    background: themeStyles.btnBg,
    color: themeStyles.color,
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 700,
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    transition: "background 0.2s, border-color 0.2s",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: themeStyles.bg, color: themeStyles.subText, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
        Loading book...
      </div>
    );
  }

  if (loadError || !book) {
    return (
      <div style={{ minHeight: "100vh", background: themeStyles.bg, color: themeStyles.color, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", padding: "32px", textAlign: "center", maxWidth: "420px" }}>
          <p style={{ marginBottom: "16px", fontWeight: 600, color: themeStyles.subText }}>{loadError ?? "Book not found."}</p>
          <Link href="/library" style={{ color: "var(--theme-accent, #D97706)", textDecoration: "none", fontWeight: 700 }}>
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  if (!book.pdfUrl) {
    return (
      <div style={{ minHeight: "100vh", background: themeStyles.bg, color: themeStyles.color, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", padding: "32px", textAlign: "center", maxWidth: "420px" }}>
          <p style={{ fontWeight: 800, marginBottom: "8px", color: themeStyles.color }}>{book.title}</p>
          <p style={{ color: themeStyles.subText, marginBottom: "16px", fontSize: "0.9rem", fontWeight: 500 }}>
            The PDF for this book hasn't been uploaded yet.
          </p>
          <Link href="/library" style={{ color: "var(--theme-accent, #D97706)", textDecoration: "none", fontWeight: 700 }}>
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", background: themeStyles.bg, color: themeStyles.color, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s, color 0.3s" }}>
      {/* Toolbar */}
      <div
        style={{
          zIndex: 20,
          background: themeStyles.toolbarBg,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${themeStyles.toolbarBorder}`,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          flexShrink: 0,
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <Link href="/library" style={{ color: themeStyles.subText, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, flexShrink: 0 }}>
          ← Library
        </Link>

        <p style={{ fontWeight: 700, fontSize: "0.9rem", flex: 1, textAlign: "center", minWidth: "150px", color: themeStyles.color }}>
          {book.title}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => goToPage(Number(pageInput) || 1)}
            onKeyDown={(e) => e.key === "Enter" && goToPage(Number(pageInput) || 1)}
            style={{
              width: "50px",
              textAlign: "center",
              background: themeStyles.btnBg,
              border: themeStyles.btnBorder,
              borderRadius: "8px",
              color: themeStyles.color,
              padding: "8px 0",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "background 0.2s, border-color 0.2s",
            }}
          />
          <span style={{ color: themeStyles.subText, fontSize: "0.82rem", fontWeight: 600 }}>/ {numPages || "..."}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button style={iconBtn} onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}>
            −
          </button>
          <span style={{ color: themeStyles.subText, fontSize: "0.78rem", width: "40px", textAlign: "center", fontWeight: 600 }}>
            {Math.round(scale * 100)}%
          </span>
          <button style={iconBtn} onClick={() => setScale((s) => Math.min(2, s + 0.1))}>
            +
          </button>
        </div>

        <button
          onClick={handleAskAI}
          disabled={extracting}
          style={{
            background: "var(--theme-accent, #F59E0B)",
            border: "none",
            color: "var(--theme-accent-text, #080C14)",
            padding: "9px 18px",
            borderRadius: "8px",
            fontWeight: 800,
            fontSize: "0.82rem",
            cursor: extracting ? "not-allowed" : "pointer",
            flexShrink: 0,
            boxShadow: "0 2px 6px var(--theme-accent-glow, rgba(245, 158, 11, 0.25))",
          }}
        >
          {extracting ? "Reading page..." : "🤖 Ask AI about this page"}
        </button>
      </div>

      {/* Continuous scrolling PDF */}
      <div ref={containerRef} style={{ flex: 1, overflow: "auto", padding: "24px 0" }}>
        <Document
          file={book.pdfUrl}
          onLoadSuccess={handleDocumentLoad}
          onLoadError={(err) => setLoadError(err.message)}
          loading={<p style={{ color: themeStyles.subText, textAlign: "center", fontWeight: 600 }}>Loading PDF...</p>}
          error={<p style={{ color: "#DC2626", textAlign: "center", fontWeight: 600 }}>Could not load this PDF file.</p>}
        >
          {allPageNumbers.map((num) => {
            const isInRenderWindow = num >= renderStart && num <= renderEnd;

            return (
              <div
                key={num}
                data-page={num}
                ref={(el) => {
                  pageElRefs.current[num] = el;
                }}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "16px",
                  minHeight: isInRenderWindow ? undefined : `${estimatedPageHeight}px`,
                }}
              >
                {isInRenderWindow ? (
                  <Page
                    pageNumber={num}
                    scale={scale}
                    renderAnnotationLayer
                    renderTextLayer
                    onLoadSuccess={num === pageNumber ? handleFirstPageMeasured : undefined}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "700px",
                      background: themeStyles.cardBg,
                      border: `1px solid ${themeStyles.cardBorder}`,
                      borderRadius: "8px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
}