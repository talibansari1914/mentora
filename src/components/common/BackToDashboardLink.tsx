"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// A small accent-colored "back" button used across the app — both for
// "back to Dashboard" (the default) and, with the props below, for
// "back to Library" / "back to Mentors" / "back to Settings" style links
// on sub-pages. Background/border/text all come from the same
// --theme-accent-* variables every other button in the app uses, so it
// always matches whatever accent color the user picked in Settings,
// instead of the plain, unstyled text links these were before.
export default function BackToDashboardLink({
  href = "/dashboard",
  label = "Dashboard",
  inline = false,
}: {
  href?: string;
  label?: string;
  // Pass `inline` when this sits alongside other items in a horizontal
  // flex row (e.g. a page's top nav bar next to a logo). Leaving it false
  // (the default) keeps the bottom margin used when this is the first
  // item stacked above a page's <h1>.
  inline?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 14px",
        borderRadius: "10px",
        background: "var(--theme-accent-soft)",
        border: "1px solid var(--theme-accent-border)",
        color: "var(--theme-accent)",
        fontSize: "0.82rem",
        fontWeight: 700,
        textDecoration: "none",
        marginBottom: inline ? 0 : "12px",
      }}
    >
      <ArrowLeft size={14} />
      {label}
    </Link>
  );
}