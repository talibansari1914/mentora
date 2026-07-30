"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { G } from "@/constants/colors";
import { bookService } from "@/services/bookService";
import { libraryService } from "@/services/libraryService";
import { Book } from "@/types/book";

// react-pdf needs a separate "worker" script to actually parse PDFs (this
// runs the heavy parsing off the main thread so the page doesn't freeze).
// Pointing it at a CDN build avoids fighting Next.js's bundler over how to
// package that worker file ourselves.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Key used to hand off extracted page text to the AI Book Tools page.
const AI_HANDOFF_KEY = "mentora_book_tools_prefill";

// How many pages before/after the current one get actually rendered as
// real PDF content. Everything outside this window is a lightweight
// spacer div — this is what lets a 1500-page PDF scroll smoothly instead
// of trying to render all 1500 pages into memory at once.
const RENDER_BUFFER = 2;

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = Number(params.id);

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1); // the page currently most visible on screen
  const [scale, setScale] = useState(1.1);
  const [pageInput, setPageInput] = useState("1");
  const [extracting, setExtracting] = useState(false);

  // Estimated height (in px, at current scale) for un-rendered placeholder
  // pages, so the scrollbar/scroll position stays roughly proportionate.
  // Refined automatically once a real page has loaded and we know its size.
  const [estimatedPageHeight, setEstimatedPageHeight] = useState(1000);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageElRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const hasResumedRef = useRef(false);
  // True right after a manual "jump to page" — suppresses the scroll
  // observer for a moment so it doesn't immediately fight the jump.
  const isJumpingRef = useRef(false);

  // ── Load the book + figure out where the student left off ──
  useEffect(() => {
    (async () => {
      try {
        const [foundBook, allProgress] = await Promise.all([
          bookService.getBookById(bookId),
          libraryService.getAllProgress(),
        ]);

        if (!foundBook) {
          setLoadError("Book not found.");
          return;
        }

        setBook(foundBook);

        const existing = allProgress.find((p) => Number(p.book_id) === bookId);
        if (existing) {
          (window as any).__mentora_resume_percent = existing.progress_percent;
        }
      } catch (err: any) {
        setLoadError(err.message ?? "Could not load this book.");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId]);

  function handleDocumentLoad({ numPages: total }: { numPages: number }) {
    setNumPages(total);

    if (!hasResumedRef.current) {
      const resumePercent = (window as any).__mentora_resume_percent ?? 0;
      if (resumePercent > 0) {
        const resumePage = Math.max(1, Math.round((resumePercent / 100) * total));
        setPageNumber(resumePage);
        setPageInput(String(resumePage));
      }
      hasResumedRef.current = true;
    }
  }

  // ── Save progress whenever the visible page changes, debounced so
  //    scrolling fast doesn't fire a database write on every frame ──
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

  // ── The "render window": real <Page> components only exist for pages
  //    in this range. Everything else is a spacer div (see the map below). ──
  const renderStart = Math.max(1, pageNumber - RENDER_BUFFER);
  const renderEnd = Math.min(numPages || 1, pageNumber + RENDER_BUFFER);

  const allPageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, i) => i + 1),
    [numPages]
  );

  // ── One IntersectionObserver watches every page slot (real or
  //    placeholder). Whichever is most visible becomes the new "current"
  //    page — this is what drives the render window as the user scrolls,
  //    and what makes scrolling near the edges pull in the next pages. ──
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
    // Re-attach whenever the render window shifts, since new placeholder/
    // real page divs get mounted and need to be observed too.
  }, [numPages, renderStart, renderEnd]);

  function goToPage(page: number) {
    const clamped = Math.min(Math.max(page, 1), numPages || 1);

    isJumpingRef.current = true;
    setPageNumber(clamped);
    setPageInput(String(clamped));

    // Wait a tick for the target page's div to mount (it may currently be
    // a placeholder outside the old render window), then scroll to it.
    setTimeout(() => {
      pageElRefs.current[clamped]?.scrollIntoView({ block: "start" });
      setTimeout(() => {
        isJumpingRef.current = false;
      }, 400);
    }, 50);
  }

  function handleFirstPageMeasured(page: any) {
    try {
      const viewport = page.getViewport({ scale });
      setEstimatedPageHeight(viewport.height);
    } catch {
      // Non-fatal — placeholders just keep using the previous estimate.
    }
  }

  // ── Extracts the current page's real text using PDF.js directly, then
  //    hands it off to AI Book Tools ──
  async function handleAskAI() {
    if (!book?.pdfUrl) return;

    setExtracting(true);
    try {
      const loadingTask = pdfjs.getDocument(book.pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");

      sessionStorage.setItem(AI_HANDOFF_KEY, pageText);
      router.push("/library/ai-tools");
    } catch (err) {
      console.error("Could not extract page text:", err);
    } finally {
      setExtracting(false);
    }
  }

  const iconBtn: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,.1)",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    fontSize: "1rem",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading book...
      </div>
    );
  }

  if (loadError || !book) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{ ...G.card, padding: "32px", textAlign: "center", maxWidth: "420px" }}>
          <p style={{ marginBottom: "16px" }}>{loadError ?? "Book not found."}</p>
          <Link href="/library" style={{ color: "#F59E0B", textDecoration: "none" }}>
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  if (!book.pdfUrl) {
    return (
      <div style={{ minHeight: "100vh", background: "#080C14", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{ ...G.card, padding: "32px", textAlign: "center", maxWidth: "420px" }}>
          <p style={{ fontWeight: 700, marginBottom: "8px" }}>{book.title}</p>
          <p style={{ color: "#64748B", marginBottom: "16px" }}>
            The PDF for this book hasn't been uploaded yet.
          </p>
          <Link href="/library" style={{ color: "#F59E0B", textDecoration: "none" }}>
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", background: "#080C14", color: "white", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div
        style={{
          zIndex: 20,
          background: "rgba(8,12,20,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,.07)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <Link href="/library" style={{ color: "#94A3B8", textDecoration: "none", fontSize: ".85rem", flexShrink: 0 }}>
          ← Library
        </Link>

        <p style={{ fontWeight: 700, fontSize: ".9rem", flex: 1, textAlign: "center", minWidth: "150px" }}>
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
              background: "#111827",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "8px",
              color: "white",
              padding: "8px 0",
              fontSize: ".85rem",
            }}
          />
          <span style={{ color: "#64748B", fontSize: ".82rem" }}>/ {numPages || "..."}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button style={iconBtn} onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}>
            −
          </button>
          <span style={{ color: "#64748B", fontSize: ".78rem", width: "40px", textAlign: "center" }}>
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
            background: G.grad,
            border: "none",
            color: "#111827",
            padding: "9px 18px",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: ".82rem",
            cursor: extracting ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          {extracting ? "Reading page..." : "🤖 Ask AI about this page"}
        </button>
      </div>

      {/* Continuous scrolling PDF — see RENDER_BUFFER comment above for how this stays fast */}
      <div ref={containerRef} style={{ flex: 1, overflow: "auto", padding: "24px 0" }}>
        <Document
          file={book.pdfUrl}
          onLoadSuccess={handleDocumentLoad}
          onLoadError={(err) => setLoadError(err.message)}
          loading={<p style={{ color: "#64748B", textAlign: "center" }}>Loading PDF...</p>}
          error={<p style={{ color: "#EF4444", textAlign: "center" }}>Could not load this PDF file.</p>}
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
                  // Lightweight placeholder — no PDF content rendered here at
                  // all, just reserves scroll space until the user scrolls
                  // close enough for this page to enter the render window.
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "700px",
                      background: "#0B1220",
                      border: "1px solid rgba(255,255,255,.04)",
                      borderRadius: "4px",
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