"use client";

import { useState } from "react";
import { G } from "@/constants/colors";
import { Collection, Book } from "@/types/book";
import { libraryService } from "@/services/libraryService";

interface CollectionsPanelProps {
  collections: Collection[];
  onCollectionsChange: (collections: Collection[]) => void;
  books: Book[];
}

export default function CollectionsPanel({ collections, onCollectionsChange, books }: CollectionsPanelProps) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = collections.find((c) => c.id === selectedId) ?? null;

  async function handleCreate() {
    if (!newName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const created = await libraryService.createCollection(newName.trim());
      onCollectionsChange([created, ...collections]);
      setNewName("");
    } catch (err: any) {
      setError(err.message ?? "Could not create collection.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await libraryService.deleteCollection(id);
      onCollectionsChange(collections.filter((c) => c.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err: any) {
      setError(err.message ?? "Could not delete collection.");
    }
  }

  async function handleToggleBook(bookId: number) {
    if (!selected) return;

    try {
      const updated = await libraryService.toggleBookInCollection(selected, bookId);
      onCollectionsChange(collections.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      setError(err.message ?? "Could not update collection.");
    }
  }

  return (
    <div>
      {/* Create new collection */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New collection name (e.g. My UPSC Shelf)"
          style={{
            flex: 1,
            background: "#0F172A",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: "10px",
            padding: "11px 14px",
            color: "white",
            fontSize: ".88rem",
            outline: "none",
          }}
        />
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            background: G.grad,
            border: "none",
            color: "#111827",
            padding: "0 20px",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: ".85rem",
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {error && <p style={{ color: "#EF4444", fontSize: ".82rem", marginBottom: "16px" }}>{error}</p>}

      {collections.length === 0 ? (
        <p style={{ color: "#64748B", fontSize: ".85rem" }}>No collections yet — create one above.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "14px", marginBottom: "24px" }}>
          {collections.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
              style={{
                ...G.card,
                padding: "18px",
                cursor: "pointer",
                border: selectedId === c.id ? "1px solid rgba(245,158,11,.4)" : G.card.border,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.4rem" }}>📁</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c.id);
                  }}
                  style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: ".72rem", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
              <p style={{ fontWeight: 700, fontSize: ".9rem", marginTop: "10px" }}>{c.name}</p>
              <p style={{ color: "#64748B", fontSize: ".78rem", marginTop: "2px" }}>
                {c.book_ids.length} book{c.book_ids.length !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Manage books inside the selected collection */}
      {selected && (
        <div style={{ ...G.card, padding: "20px" }}>
          <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>{selected.name}</h3>
          <p style={{ color: "#64748B", fontSize: ".8rem", marginBottom: "16px" }}>
            Tap a book to add or remove it from this collection.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {books.map((book) => {
              const inCollection = selected.book_ids.includes(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => handleToggleBook(book.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: inCollection ? "1px solid rgba(245,158,11,.3)" : "1px solid rgba(255,255,255,.06)",
                    background: inCollection ? "rgba(245,158,11,.08)" : "transparent",
                    color: "white",
                    fontSize: ".85rem",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span>
                    {book.icon} {book.title}
                  </span>
                  <span style={{ color: inCollection ? "#F59E0B" : "#475569", fontWeight: 700 }}>
                    {inCollection ? "✓ Added" : "+ Add"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}