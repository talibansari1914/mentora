// ============================================================================
// src/lib/renderMarkdownLite.tsx
//
// Single shared renderer for the lightweight markdown-ish text every AI
// feature prompt is asked to produce. Syntax (matches what the system
// prompts in src/app/api/*/route.ts now instruct the model to output):
//
//   - Title: the FIRST non-blank line of the response, with no leading
//     symbol at all (no #, no *). Detected by position, not a marker.
//     Rendered bold + italic, the largest heading in the block.
//   - Section heading: any line where the ENTIRE trimmed line is one
//     **bold** span and nothing else (e.g. "**Causes**" on its own line).
//     Rendered bold with generous spacing above/below - this is what
//     visually separates one section from the next.
//   - Inline **bold**: anywhere else inside a line - reserved for
//     keywords, concepts, formulas, and key-term definitions. Highlighted
//     in the accent color.
//   - Inline *italic* (single asterisk): scientific names, foreign words,
//     rare emphasis.
//   - Inline <u>text</u>: underline, meant to be used sparingly by the
//     prompt (1-2 critical points per response).
//   - "- " / "* " bullets, with 2+ leading spaces for an indented
//     sub-point.
//   - Math: "$...$" for inline math (e.g. "the slope $m = 2x$ here"), and a
//     line consisting of ONLY "$$...$$" for a centered block equation.
//     Every AI provider is asked to use standard LaTeX for any formula
//     (JEE/NEET physics & maths especially), so this is what turns that
//     raw "$f(x) = x^2$" text into an actually-rendered equation instead of
//     showing the literal dollar signs. Rendered with KaTeX - if a
//     provider ever emits malformed LaTeX, KaTeX degrades to showing the
//     original text/error inline rather than crashing the page.
//
// Backward-compatible fallback: "# " and "## " prefixes are still handled
// (mapped to the same Title / Section-heading styles) in case a fallback
// AI provider ignores the "no heading symbols" instruction and reverts to
// the old style - the UI never shows a literal "#" either way.
//
// Usage:
//   import { renderMarkdownLite } from "@/lib/renderMarkdownLite";
//   {renderMarkdownLite(answerText)}
// Optional per-page color overrides (falls back to the shared theme tokens):
//   renderMarkdownLite(answerText, { textColor: themeStyles.fileText })
// ============================================================================

import { Fragment, type ReactNode } from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

export interface RenderMarkdownLiteOptions {
  /** Color for the title line and section headings. */
  headingColor?: string;
  /** Color for bullet dots and highlighted **bold** / underline text. */
  accentColor?: string;
  /** Color for paragraph and bullet body text. */
  textColor?: string;
}

const SECTION_HEADING_RE = /^\*\*(.+)\*\*$/;
// A line that is ONLY a "$$...$$" block is rendered as a centered,
// standalone equation rather than an inline one.
const BLOCK_MATH_RE = /^\$\$(.+)\$\$$/;
// Order matters: bold (**...**), underline (<u>...</u>), and inline math
// ($...$) are matched before the single-asterisk italic pattern, so none
// of them are ever half-consumed by the italic rule. Inline math excludes
// "$" and newlines from its content so it can't accidentally swallow a
// whole paragraph if a provider forgets a closing "$".
const INLINE_TOKEN_RE = /(\*\*[^*]+\*\*|<u>[\s\S]+?<\/u>|\$[^$\n]+\$|\*[^*]+\*)/g;

// Splits a line into bold / underline / italic / plain segments and wraps
// each in the right element. Handles multiple spans per line.
function renderInline(text: string, accentColor: string): ReactNode {
  const segments = text.split(INLINE_TOKEN_RE).filter((s) => s.length > 0);
  if (segments.length <= 1) return text;

  return segments.map((segment, idx) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={idx} style={{ color: accentColor, fontWeight: 700 }}>
          {segment.slice(2, -2)}
        </strong>
      );
    }
    if (segment.startsWith("<u>") && segment.endsWith("</u>")) {
      return (
        <u key={idx} style={{ textDecorationColor: accentColor }}>
          {segment.slice(3, -4)}
        </u>
      );
    }
    if (segment.startsWith("$") && segment.endsWith("$")) {
      return <InlineMath key={idx} math={segment.slice(1, -1)} />;
    }
    if (segment.startsWith("*") && segment.endsWith("*")) {
      return (
        <em key={idx} style={{ fontStyle: "italic" }}>
          {segment.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={idx}>{segment}</Fragment>;
  });
}

export function renderMarkdownLite(text: string, options: RenderMarkdownLiteOptions = {}): ReactNode[] {
  const headingColor = options.headingColor ?? "var(--theme-text-main, #F8FAFC)";
  const accentColor = options.accentColor ?? "var(--theme-accent, #F59E0B)";
  const textColor = options.textColor ?? "var(--theme-text-sub, #CBD5E1)";

  let titleRendered = false;

  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    const leadingSpaces = line.length - line.trimStart().length;
    const isBulletLine = trimmed.startsWith("- ") || trimmed.startsWith("* ");
    const isSubBullet = isBulletLine && leadingSpaces >= 2;

    if (trimmed === "") {
      return <div key={i} style={{ height: "6px" }} />;
    }

    const blockMathMatch = trimmed.match(BLOCK_MATH_RE);
    if (blockMathMatch) {
      titleRendered = true; // A leading equation line should never later be mistaken for the title.
      return (
        <div key={i} style={{ margin: "14px 0", overflowX: "auto" }}>
          <BlockMath math={blockMathMatch[1]} />
        </div>
      );
    }

    // Backward-compat: a fallback provider that still emits "# " gets the
    // same Title treatment as the positional title below.
    const isHashTitle = trimmed.startsWith("# ");
    if (!titleRendered && !isBulletLine && (isHashTitle || !trimmed.startsWith("## "))) {
      titleRendered = true;
      const titleText = isHashTitle ? trimmed.slice(2) : trimmed;
      return (
        <h1
          key={i}
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            fontStyle: "italic",
            marginTop: 0,
            marginBottom: "18px",
            color: headingColor,
          }}
        >
          {renderInline(titleText, accentColor)}
        </h1>
      );
    }

    // Backward-compat: "## " prefix still maps to the Section-heading style.
    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={i}
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            marginTop: "30px",
            marginBottom: "12px",
            color: headingColor,
          }}
        >
          {renderInline(trimmed.slice(3), accentColor)}
        </h2>
      );
    }

    // A line that is ENTIRELY one **bold** span (nothing else on the line)
    // is a section heading - this is how sections are separated without
    // relying on "#"/"##" symbols.
    const sectionMatch = trimmed.match(SECTION_HEADING_RE);
    if (sectionMatch) {
      return (
        <h2
          key={i}
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            marginTop: "30px",
            marginBottom: "12px",
            color: headingColor,
          }}
        >
          {renderInline(sectionMatch[1], accentColor)}
        </h2>
      );
    }

    if (isSubBullet) {
      return (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "8px",
            marginLeft: "22px",
            marginBottom: "5px",
            color: textColor,
            fontSize: ".88rem",
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: accentColor, opacity: 0.7 }}>‣</span>
          <span>{renderInline(trimmed.slice(2), accentColor)}</span>
        </div>
      );
    }

    if (isBulletLine) {
      return (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "6px",
            color: textColor,
            fontSize: ".92rem",
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: accentColor }}>•</span>
          <span>{renderInline(trimmed.slice(2), accentColor)}</span>
        </div>
      );
    }

    return (
      <p
        key={i}
        style={{
          color: textColor,
          fontSize: ".92rem",
          lineHeight: 1.7,
          marginBottom: "8px",
        }}
      >
        {renderInline(trimmed, accentColor)}
      </p>
    );
  });
}