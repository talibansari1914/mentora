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
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        width: "100%",
        padding: "14px 20px",
        borderRadius: "14px",
        border: "none",
        background: disabled ? "#1f2937" : G.grad,
        color: disabled ? "#94A3B8" : "#111827",
        fontWeight: 800,
        fontSize: "0.95rem",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: disabled ? "none" : "0 4px 20px rgba(245, 158, 11, 0.25)",
        transition: "all 0.2s ease",
        marginBottom: "28px"
      }}
    >
      {isLoading ? (
        <>
          <Loader2 size={18} className="animate-spin" /> Generating AI Notes...
        </>
      ) : (
        <>
          <Sparkles size={18} /> Generate Notes
        </>
      )}
    </button>
  );
};