"use client";

import React, { useState } from "react";
import { Collection, Book } from "@/types/book";
import { libraryService } from "@/services/libraryService";
import { getErrorMessage } from "@/lib/errors";

interface CollectionsPanelProps {
  collections: Collection[];
  onCollectionsChange: (collections: Collection[]) => void;
  books: Book[];
}

export default function CollectionsPanel({
  collections,
  onCollectionsChange,
  books,
}: CollectionsPanelProps) {
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not create collection."));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await libraryService.deleteCollection(id);
      onCollectionsChange(collections.filter((c) => c.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not delete collection."));
    }
  }

  async function handleToggleBook(bookId: number) {
    if (!selected) return;

    try {
      const updated = await libraryService.toggleBookInCollection(selected, bookId);
      onCollectionsChange(
        collections.map((c) => (c.id === updated.id ? updated : c))
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not update collection."));
    }
  }

  return (
    <div>
      {/* Create new collection bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New collection name (e.g. My UPSC Shelf)"
          style={{
            flex: 1,
            minWidth: "220px",
            background: "var(--theme-hover-bg, #FFFFFF)",
            border: "1px solid var(--theme-border, #CBD5E1)",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "var(--theme-text-main, #0F172A)",
            fontSize: "0.9rem",
            outline: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        />
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            background: "var(--theme-accent, #F59E0B)",
            border: "none",
            color: "var(--theme-accent-text, #0F172A)",
            padding: "12px 24px",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "0.88rem",
            cursor: creating ? "not-allowed" : "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            whiteSpace: "nowrap",
          }}
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {error && (
        <p
          style={{
            color: "#DC2626",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "16px",
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            padding: "10px 14px",
            borderRadius: "8px",
          }}
        >
          {error}
        </p>
      )}

      {collections.length === 0 ? (
        <div
          style={{
            background: "var(--theme-card-bg, #FFFFFF)",
            border: "2px dashed var(--theme-border, #E2E8F0)",
            borderRadius: "16px",
            padding: "40px 20px",
            textAlign: "center",
            color: "var(--theme-text-sub, #64748B)",
            fontSize: "0.88rem",
            fontWeight: 500,
          }}
        >
          📂 No collections yet — create one above.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          {collections.map((c) => {
            const isSelected = selectedId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(isSelected ? null : c.id)}
                style={{
                  background: isSelected ? "var(--theme-accent-soft, #FFFBEB)" : "var(--theme-card-bg, #FFFFFF)",
                  border: isSelected ? "2px solid var(--theme-accent, #F59E0B)" : "1px solid var(--theme-border, #E2E8F0)",
                  borderRadius: "14px",
                  padding: "18px",
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? "0 4px 12px var(--theme-accent-glow, rgba(245, 158, 11, 0.15))"
                    : "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>📁</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#DC2626",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "2px 4px",
                    }}
                  >
                    Delete
                  </button>
                </div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    color: "var(--theme-text-main, #0F172A)",
                    marginTop: "12px",
                    marginBottom: "4px",
                  }}
                >
                  {c.name}
                </p>
                <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.78rem", margin: 0, fontWeight: 500 }}>
                  {c.book_ids.length} book{c.book_ids.length !== 1 ? "s" : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Manage books inside selected collection */}
      {selected && (
        <div
          style={{
            background: "var(--theme-card-bg, #FFFFFF)",
            border: "1px solid var(--theme-border, #E2E8F0)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h3
            style={{
              fontWeight: 800,
              fontSize: "1.05rem",
              color: "var(--theme-text-main, #0F172A)",
              marginBottom: "4px",
              margin: "0 0 4px 0",
            }}
          >
            Managing: {selected.name}
          </h3>
          <p style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.82rem", marginBottom: "16px", marginTop: 0 }}>
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
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: inCollection ? "1px solid var(--theme-accent-border, #FDE68A)" : "1px solid var(--theme-border, #E2E8F0)",
                    background: inCollection ? "var(--theme-accent-soft, #FEF3C7)" : "var(--theme-hover-bg, #F8FAFC)",
                    color: "var(--theme-text-main, #0F172A)",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {book.icon} {book.title}
                  </span>
                  <span
                    style={{
                      color: inCollection ? "var(--theme-accent, #B45309)" : "var(--theme-text-sub, #64748B)",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                    }}
                  >
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