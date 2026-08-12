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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", boxSizing: "border-box" }}>
      <style>{`
        .mentor-filter-box {
          background: var(--theme-card-bg);
          border: 1px solid var(--theme-border);
          color: var(--theme-text-main);
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .mentor-filter-input {
          color: var(--theme-text-main);
        }
        .mentor-filter-input::placeholder {
          color: var(--theme-text-sub);
        }

        .mentor-filter-select {
          background: var(--theme-card-bg);
          border: 1px solid var(--theme-border);
          color: var(--theme-text-main);
        }

        .mentor-filter-option {
          background: var(--theme-card-bg);
          color: var(--theme-text-main);
        }

        @media (max-width: 640px) {
          .mentor-filters-row {
            flex-direction: column !important;
          }
          .mentor-filter-select {
            flex: 1 1 100% !important;
            width: 100% !important;
            min-width: 100% !important;
          }
        }
      `}</style>

      {/* Search Bar */}
      <div
        className="mentor-filter-box"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderRadius: "14px",
          padding: "12px 16px",
          width: "100%",
          boxSizing: "border-box",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <Search size={18} style={{ color: "var(--theme-accent)", flexShrink: 0 }} />
        <input
          className="mentor-filter-input"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, subject, or skill..."
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            fontSize: ".9rem",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Select Dropdowns Row */}
      <div className="mentor-filters-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap", width: "100%" }}>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="mentor-filter-select"
          style={{
            borderRadius: "12px",
            padding: "11px 14px",
            fontSize: ".85rem",
            fontWeight: 600,
            outline: "none",
            cursor: "pointer",
            flex: "1 1 140px",
            minWidth: "140px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            transition: "all 0.2s ease",
          }}
        >
          {LANGUAGES_FILTER.map((l) => (
            <option key={l} value={l} className="mentor-filter-option">
              {l === "Any" ? "🌐 Any Language" : l}
            </option>
          ))}
        </select>

        <select
          value={minExperience}
          onChange={(e) => onMinExperienceChange(Number(e.target.value))}
          className="mentor-filter-select"
          style={{
            borderRadius: "12px",
            padding: "11px 14px",
            fontSize: ".85rem",
            fontWeight: 600,
            outline: "none",
            cursor: "pointer",
            flex: "1 1 140px",
            minWidth: "140px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            transition: "all 0.2s ease",
          }}
        >
          {EXPERIENCE_FILTER.map((e) => (
            <option key={e.label} value={e.min} className="mentor-filter-option">
              💼 {e.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="mentor-filter-select"
          style={{
            borderRadius: "12px",
            padding: "11px 14px",
            fontSize: ".85rem",
            fontWeight: 600,
            outline: "none",
            cursor: "pointer",
            flex: "1 1 140px",
            minWidth: "140px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            transition: "all 0.2s ease",
          }}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value} className="mentor-filter-option">
              ⚡ {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}