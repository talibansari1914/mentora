"use client";

import { useEffect, useState } from "react";
import { memoryService, RevisionItem, ReviewQuality } from "@/services/memoryService";

const G = {
  grad: "linear-gradient(135deg,#F59E0B,#FBBF24)",
  gradText: {
    background: "linear-gradient(135deg,#F59E0B,#FBBF24)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  card: {
    background: "#0B1220",
    border: "1px solid rgba(255,255,255,.06)",
    borderRadius: "16px",
  },
};

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

export default function MemoryAssistantPage() {
  const [dueItems, setDueItems] = useState<RevisionItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revealedId, setRevealedId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newExam, setNewExam] = useState("upsc");

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [due, upcoming] = await Promise.all([
        memoryService.getDueItems(),
        memoryService.getUpcomingItems(),
      ]);
      setDueItems(due);
      setUpcomingItems(upcoming);
    } catch (err: any) {
      setError(err.message ?? "Could not load revision items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAdd() {
    if (!newTitle.trim() || !newSubject.trim()) {
      setError("Please enter both a title and a subject.");
      return;
    }
    try {
      await memoryService.addItem({
        title: newTitle.trim(),
        subject: newSubject.trim(),
        exam: newExam,
      });
      setNewTitle("");
      setNewSubject("");
      loadAll();
    } catch (err: any) {
      setError(err.message ?? "Could not add item.");
    }
  }

  async function handleReview(item: RevisionItem, quality: ReviewQuality) {
    setDueItems((prev) => prev.filter((i) => i.id !== item.id));
    setRevealedId(null);
    try {
      await memoryService.reviewItem(item, quality);
      loadAll();
    } catch {
      loadAll();
    }
  }

  async function handleDelete(id: string) {
    setUpcomingItems((prev) => prev.filter((i) => i.id !== id));
    setDueItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await memoryService.deleteItem(id);
    } catch {
      loadAll();
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "10px",
    padding: "10px 12px",
    color: "white",
    fontSize: ".88rem",
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080C14",
        color: "white",
        fontFamily: "'DM Sans',sans-serif",
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            Memory <span style={G.gradText}>Assistant</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Add topics you want to remember. Spaced repetition decides when you should revise them next — right before you'd naturally start forgetting.
          </p>
        </header>

        {error && (
          <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "16px" }}>{error}</p>
        )}

        {/* Add item */}
        <div style={{ ...G.card, padding: "18px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Topic (e.g. Newton's Laws of Motion)"
              style={{ ...inputStyle, flex: 2, minWidth: "200px" }}
            />
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Subject (e.g. Physics)"
              style={{ ...inputStyle, flex: 1, minWidth: "140px" }}
            />
            <select value={newExam} onChange={(e) => setNewExam(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {EXAMS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            style={{
              width: "100%",
              background: G.grad,
              border: "none",
              color: "#111827",
              padding: "11px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: ".9rem",
            }}
          >
            Add to Memory
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#64748B", fontSize: ".85rem" }}>Loading...</p>
        ) : (
          <>
            {/* Due today */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "14px" }}>
                Due for Review Today{" "}
                {dueItems.length > 0 && (
                  <span style={{ color: "#F59E0B" }}>({dueItems.length})</span>
                )}
              </h3>

              {dueItems.length === 0 ? (
                <div style={{ ...G.card, padding: "24px", textAlign: "center", color: "#64748B", fontSize: ".85rem" }}>
                  Nothing due right now. Add a topic above, or check back later.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {dueItems.map((item) => {
                    const isRevealed = revealedId === item.id;
                    return (
                      <div key={item.id} style={{ ...G.card, padding: "18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: ".95rem" }}>{item.title}</p>
                            <p style={{ color: "#64748B", fontSize: ".78rem", marginTop: "2px" }}>
                              {item.subject} · {item.exam.toUpperCase()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: ".75rem", cursor: "pointer" }}
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
                              border: "1px dashed rgba(255,255,255,.15)",
                              color: "#94A3B8",
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
                            <p style={{ color: "#94A3B8", fontSize: ".82rem", marginBottom: "10px" }}>
                              How well did you remember this?
                            </p>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => handleReview(item, 2)}
                                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.08)", color: "#EF4444", fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}
                              >
                                Hard
                              </button>
                              <button
                                onClick={() => handleReview(item, 4)}
                                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid rgba(245,158,11,.3)", background: "rgba(245,158,11,.08)", color: "#F59E0B", fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}
                              >
                                Good
                              </button>
                              <button
                                onClick={() => handleReview(item, 5)}
                                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid rgba(34,197,94,.3)", background: "rgba(34,197,94,.08)", color: "#22C55E", fontWeight: 700, cursor: "pointer", fontSize: ".82rem" }}
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
              <h3 style={{ fontWeight: 700, marginBottom: "14px" }}>Upcoming Reviews</h3>
              {upcomingItems.length === 0 ? (
                <div style={{ ...G.card, padding: "24px", textAlign: "center", color: "#64748B", fontSize: ".85rem" }}>
                  No upcoming reviews scheduled yet.
                </div>
              ) : (
                <div style={{ ...G.card, padding: "8px 18px" }}>
                  {upcomingItems.map((item, i) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 0",
                        borderBottom: i < upcomingItems.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
                      }}
                    >
                      <div>
                        <p style={{ fontSize: ".88rem", fontWeight: 600 }}>{item.title}</p>
                        <p style={{ color: "#64748B", fontSize: ".75rem" }}>
                          {item.subject} · {item.exam.toUpperCase()}
                        </p>
                      </div>
                      <span style={{ color: "#94A3B8", fontSize: ".78rem" }}>
                        in {daysFromToday(item.next_review_at)} day
                        {daysFromToday(item.next_review_at) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}