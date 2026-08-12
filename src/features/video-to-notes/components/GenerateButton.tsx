/*
Purpose:
Renders the primary call-to-action button to trigger notes generation with loading spinner support.
Inputs:
- onClick: function
- isLoading: boolean
- disabled: boolean
Returns:
JSX element for generation button.
*/

"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { G } from "@/constants/colors";

interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  isLoading,
  disabled,
}) => {
  return (
    <>
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: "14px",
          border: disabled ? "1px solid var(--theme-border)" : "none",
          background: disabled ? "var(--theme-hover-bg)" : G.grad,
          color: disabled ? "var(--theme-text-sub)" : "var(--theme-accent-text)",
          fontWeight: 800,
          fontSize: "0.95rem",
          cursor: disabled || isLoading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: disabled ? "none" : "0 4px 20px var(--theme-accent-glow)",
          transition: "all 0.2s ease",
          marginBottom: "28px",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="mentora-spin-icon" /> Generating AI Notes...
          </>
        ) : (
          <>
            <Sparkles size={18} /> Generate Notes
          </>
        )}
      </button>

      {/* Matches the rest of the app's pattern of scoped keyframe
          animations via style jsx (see signup/page.tsx, text-to-audio's
          page.tsx) instead of pulling in a Tailwind utility class for
          just this one icon. */}
      <style jsx>{`
        .mentora-spin-icon {
          animation: mentora-spin 1s linear infinite;
        }
        @keyframes mentora-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};