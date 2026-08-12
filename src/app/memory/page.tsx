"use client";

import { useEffect, useRef, useState } from "react";
import { memoryService, RevisionItem, ReviewQuality } from "@/services/memoryService";
import { gradAmber, gradTextAmber } from "@/lib/theme";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

const G = { grad: gradAmber, gradText: gradTextAmber };

const EXAMS = [
  { value: "upsc", label: "UPSC" },
  { value: "jee", label: "JEE" },
  { value: "neet", label: "NEET" },
  { value: "ssc", label: "SSC" },
];

function daysFromToday(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// Static theme-token style map — driven entirely by the shared --theme-* CSS
// variables set on <html data-theme="dark|light">, so this page always mirrors
// the dashboard toggle exactly with zero extra JS/state.
const themeStyles = {
  bg: "var(--theme-bg-main)",
  color: "var(--theme-text-main)",
  subText: "var(--theme-text-sub)",
  mutedText: "var(--theme-text-sub)",
  cardBg: "var(--theme-card-bg)",
  cardBorder: "1px solid var(--theme-border)",
  inputBg: "var(--theme-card-bg)",
  inputColor: "var(--theme-text-main)",
  inputBorder: "1px solid var(--theme-border)",
  dashedBorder: "1px dashed var(--theme-border)",
  divider: "var(--theme-border)",
};

export default function MemoryAssistantPage() {
  const [dueItems, setDueItems] = useState<RevisionItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revealedId, setRevealedId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newExam, setNewExam] = useState("upsc");
  // Guards handleAdd against double-submit — without this, a fast
  // double-click/tap (or a slow network) could fire addItem() twice before
  // the first call resolves, creating a duplicate revision item.
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Tracks whether this page is still mounted, so loadAll() (called on
  // mount and again after add/review/delete) doesn't call setState after
  // the user has already navigated away while a request was in flight.
  const isMountedRef = useRef(true);
  useEffect(() => {
    // React StrictMode (dev only) double-invokes this effect: mount ->
    // cleanup -> mount again. Without resetting to `true` here, the first
    // (StrictMode-only) cleanup would permanently leave this `false` even
    // though the component is genuinely mounted — silently dropping every
    // setState call below for the rest of this component's real lifetime.
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // showLoading=false is used for refreshes after an add/review/delete — the
  // list was already updated optimistically, so re-showing the "Loading..."
  // skeleton would just make the UI flicker for no reason. Only the very
  // first, initial load (on mount) needs the loading state.
  async function loadAll(showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [due, upcoming] = await Promise.all([
        memoryService.getDueItems(),
        memoryService.getUpcomingItems(),
      ]);
      if (!isMountedRef.current) return;
      setDueItems(due);
      setUpcomingItems(upcoming);
    } catch (err: unknown) {
      if (isMountedRef.current) setError(getErrorMessage(err, "Could not load revision items."));
    } finally {
      if (showLoading && isMountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAdd() {
    if (isAddingItem) return; // Ignore repeat clicks while a request is already in flight

    if (!newTitle.trim() || !newSubject.trim()) {
      setError("Please enter both a title and a subject.");
      return;
    }
    try {
      setIsAddingItem(true);
      await memoryService.addItem({
        title: newTitle.trim(),
        subject: newSubject.trim(),
        exam: newExam,
      });
      setNewTitle("");
      setNewSubject("");
      loadAll(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not add item."));
    } finally {
      setIsAddingItem(false);
    }
  }

  async function handleReview(item: RevisionItem, quality: ReviewQuality) {
    setDueItems((prev) => prev.filter((i) => i.id !== item.id));
    setRevealedId(null);
    try {
      await memoryService.reviewItem(item, quality);
      loadAll(false);
    } catch {
      loadAll(false);
    }
  }

  async function handleDelete(id: string) {
    setUpcomingItems((prev) => prev.filter((i) => i.id !== id));
    setDueItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await memoryService.deleteItem(id);
    } catch {
      loadAll(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: themeStyles.cardBorder,
    borderRadius: "16px",
    transition: "background 0.3s, border 0.3s",
    boxSizing: "border-box",
  };

  const inputStyle: React.CSSProperties = {
    background: themeStyles.inputBg,
    border: themeStyles.inputBorder,
    borderRadius: "10px",
    padding: "11px 14px",
    color: themeStyles.inputColor,
    fontSize: ".88rem",
    outline: "none",
    transition: "background 0.3s, color 0.3s, border 0.3s",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeStyles.bg,
        color: themeStyles.color,
        fontFamily: "'DM Sans',sans-serif",
        padding: "clamp(16px, 4vw, 32px)",
        transition: "background 0.3s, color 0.3s",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "24px" }}>
          <BackToDashboardLink />
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 800, marginBottom: "8px", color: themeStyles.color }}>
            Memory <span style={G.gradText}>Assistant</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: ".95rem" }}>
            Add topics you want to remember. Spaced repetition decides when you should revise them next — right before you'd naturally start forgetting.
          </p>
        </header>

        {error && (
          <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "16px" }}>{error}</p>
        )}

        {/* Add item */}
        <div style={{ ...cardStyle, padding: "18px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Topic (e.g. Newton's Laws of Motion)"
              style={{ ...inputStyle, flex: "2 1 200px" }}
            />
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Subject (e.g. Physics)"
              style={{ ...inputStyle, flex: "1 1 140px" }}
            />
            <select value={newExam} onChange={(e) => setNewExam(e.target.value)} style={{ ...inputStyle, flex: "1 1 120px" }}>
              {EXAMS.map((e) => (
                <option key={e.value} value={e.value} style={{ background: themeStyles.inputBg, color: themeStyles.inputColor }}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={isAddingItem}
            style={{
              width: "100%",
              background: G.grad,
              border: "none",
              color: "var(--theme-accent-text)",
              padding: "11px",
              borderRadius: "10px",
              cursor: isAddingItem ? "not-allowed" : "pointer",
              opacity: isAddingItem ? 0.7 : 1,
              fontWeight: 700,
              fontSize: ".9rem",
            }}
          >
            {isAddingItem ? "Adding..." : "Add to Memory"}
          </button>
        </div>

        {loading ? (
          <p style={{ color: themeStyles.subText, fontSize: ".85rem" }}>Loading...</p>
        ) : (
          <>
            {/* Due today */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "14px", color: themeStyles.color }}>
                Due for Review Today{" "}
                {dueItems.length > 0 && (
                  <span style={{ color: "var(--theme-accent)" }}>({dueItems.length})</span>
                )}
              </h3>

              {dueItems.length === 0 ? (
                <div style={{ ...cardStyle, padding: "24px", textAlign: "center", color: themeStyles.subText, fontSize: ".85rem" }}>
                  Nothing due right now. Add a topic above, or check back later.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {dueItems.map((item) => {
                    const isRevealed = revealedId === item.id;
                    return (
                      <div key={item.id} style={{ ...cardStyle, padding: "18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: ".95rem", color: themeStyles.color }}>{item.title}</p>
                            <p style={{ color: themeStyles.subText, fontSize: ".78rem", marginTop: "2px" }}>
                              {item.subject} · {item.exam.toUpperCase()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: ".75rem", cursor: "pointer", flexShrink: 0 }}
                          >
                            Delete
                          </button>
                        </div>

                        {!isRevealed ? (
                          <button
                            onClick={() => setRevealedId(item.id)}
                            style={{
                              width: "100%",
                              marginTop: "14px",
                              background: "transparent",
                              border: themeStyles.dashedBorder,
                              color: themeStyles.subText,
                              padding: "10px",
                              borderRadius: "10px",
                              cursor: "pointer",
                              fontSize: ".85rem",
                            }}
                          >
                            Try to recall it, then tap to reveal
                          </button>
                        ) : (
                          <div style={{ marginTop: "14px" }}>
                            <p style={{ color: themeStyles.subText, fontSize: ".82rem", marginBottom: "10px" }}>
                              How well did you remember this?
                            </p>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button
                                onClick={() => handleReview(item, 2)}
                                style={{ flex: "1 1 80px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.08)", color: "#EF4444", fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}
                              >
                                Hard
                              </button>
                              <button
                                onClick={() => handleReview(item, 4)}
                                style={{ flex: "1 1 80px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(245,158,11,.3)", background: "rgba(245,158,11,.08)", color: "var(--theme-accent)", fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}
                              >
                                Good
                              </button>
                              <button
                                onClick={() => handleReview(item, 5)}
                                style={{ flex: "1 1 80px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(34,197,94,.3)", background: "rgba(34,197,94,.08)", color: "#22C55E", fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}
                              >
                                Easy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: "14px", color: themeStyles.color }}>Upcoming Reviews</h3>
              {upcomingItems.length === 0 ? (
                <div style={{ ...cardStyle, padding: "24px", textAlign: "center", color: themeStyles.subText, fontSize: ".85rem" }}>
                  No upcoming reviews scheduled yet.
                </div>
              ) : (
                <div style={{ ...cardStyle, padding: "8px 18px" }}>
                  {upcomingItems.map((item, i) => {
                    const daysAway = daysFromToday(item.next_review_at);
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 0",
                          borderBottom: i < upcomingItems.length - 1 ? `1px solid ${themeStyles.divider}` : "none",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: ".88rem", fontWeight: 600, color: themeStyles.color }}>{item.title}</p>
                          <p style={{ color: themeStyles.subText, fontSize: ".75rem" }}>
                            {item.subject} · {item.exam.toUpperCase()}
                          </p>
                        </div>
                        <span style={{ color: themeStyles.subText, fontSize: ".78rem" }}>
                          in {daysAway} day{daysAway !== 1 ? "s" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}