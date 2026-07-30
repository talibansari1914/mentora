"use client";

interface LibrarySearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function LibrarySearchBar({ value, onChange, placeholder }: LibrarySearchBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#111827",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: "14px",
        padding: "13px 18px",
        marginBottom: "20px",
        maxWidth: "560px",
      }}
    >
      <span style={{ fontSize: "1rem", color: "#64748B" }}>🔍</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search by book title or author..."}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          outline: "none",
          color: "white",
          fontSize: "0.9rem",
          fontFamily: "inherit",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "0.9rem" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}