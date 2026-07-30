"use client";

import { Dispatch, SetStateAction } from "react";
import { LANGUAGES_FILTER, EXPERIENCE_FILTER, SORT_OPTIONS } from "@/constants/mentors";
import { Search } from "lucide-react";

interface MentorFiltersProps {
  search: string;
  onSearchChange: Dispatch<SetStateAction<string>>;
  language: string;
  onLanguageChange: Dispatch<SetStateAction<string>>;
  minExperience: number;
  onMinExperienceChange: Dispatch<SetStateAction<number>>;
  sort: string;
  onSortChange: Dispatch<SetStateAction<string>>;
}

export default function MentorFilters({
  search,
  onSearchChange,
  language,
  onLanguageChange,
  minExperience,
  onMinExperienceChange,
  sort,
  onSortChange,
}: MentorFiltersProps) {
  const selectStyle: React.CSSProperties = {
    background: "#161f31",
    border: "1px solid #2d3748",
    borderRadius: "12px",
    padding: "11px 14px",
    color: "white",
    fontSize: ".85rem",
    fontWeight: 600,
    outline: "none",
    cursor: "pointer",
    flex: 1,
    minWidth: "140px",
    transition: "all 0.2s ease",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#161f31",
          border: "1px solid #2d3748",
          borderRadius: "14px",
          padding: "12px 16px",
          width: "100%",
          boxSizing: "border-box",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <Search size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, subject, or skill..."
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: "white",
            fontSize: ".9rem",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Select Dropdowns Row */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", width: "100%" }}>
        <select value={language} onChange={(e) => onLanguageChange(e.target.value)} style={selectStyle}>
          {LANGUAGES_FILTER.map((l) => (
            <option key={l} value={l} style={{ background: "#0b0f17", color: "white" }}>
              {l === "Any" ? "🌐 Any Language" : l}
            </option>
          ))}
        </select>

        <select
          value={minExperience}
          onChange={(e) => onMinExperienceChange(Number(e.target.value))}
          style={selectStyle}
        >
          {EXPERIENCE_FILTER.map((e) => (
            <option key={e.label} value={e.min} style={{ background: "#0b0f17", color: "white" }}>
              💼 {e.label}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => onSortChange(e.target.value)} style={selectStyle}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value} style={{ background: "#0b0f17", color: "white" }}>
              ⚡ {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}