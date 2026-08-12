// ============================================================================
// src/lib/theme.ts
//
// Single source of truth for the gradient tokens used across feature pages
// for their accent buttons, active tabs, and gradient headings.
//
// Before this file existed, ~16 pages each defined their own local
// `const G = { grad: "linear-gradient(...)" , ... }` with the literal
// gradient string copy-pasted in every file. That's how 3 pages drifted to
// a plain hardcoded hex color instead of the theme-aware var(--theme-accent)
// version - nothing enforced that every copy stayed in sync.
//
// All three gradient variants below are genuinely different by design
// (different pages intentionally use a different angle/color pair), so this
// file does NOT collapse them into one - it just gives each variant exactly
// one definition, so a future change or fix only has to happen in one place.
//
// Usage in a page:
//   import { gradAmber, gradTextAmber } from "@/lib/theme";
//   const G = { grad: gradAmber, gradText: gradTextAmber };
// Or, for a page with extra local tokens (e.g. a "card" style):
//   const G = { grad: gradAmber, gradText: gradTextAmber, card: { ... } };
// ============================================================================

import type { CSSProperties } from "react";

// Used by: mock-test-assistant, question-bank, writing-assistant, planner,
// notes, mentor, coding-mentor, practice, analytics, memory.
export const gradAmber =
  "linear-gradient(135deg, var(--theme-accent, #F59E0B), var(--theme-accent-light, #FBBF24))";

export const gradTextAmber: CSSProperties = {
  background: gradAmber,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

// Used by: pyqs, my-notes.
export const gradAmberOrange =
  "linear-gradient(120deg, var(--theme-accent, #F59E0B), var(--theme-accent-light, #F97316))";

export const gradTextAmberOrange: CSSProperties = {
  background: gradAmberOrange,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

// Used by: mock-tests/[id], mock-tests/result.
export const gradAmberDeep =
  "linear-gradient(120deg, var(--theme-accent, #D97706), var(--theme-accent-light, #F59E0B))";

export const gradTextAmberDeep: CSSProperties = {
  background: gradAmberDeep,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};