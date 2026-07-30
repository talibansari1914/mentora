/*
  Purpose:
    Renders the primary trigger button to generate audio from text.
    Handles loading spinner display and disabled validation states.
  Input:
    onClick (function): Callback function triggered when button is clicked.
    isGenerating (boolean): Whether audio synthesis is currently in progress.
    disabled (boolean, optional): Whether the button should be unclickable (e.g., invalid input).
  Outputs:
    React component rendering a responsive, accessible action button.
  Future:
    Can be expanded to display estimated token costs or remaining generation credits.
*/

import React from 'react';

export interface GenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  isGenerating,
  disabled = false
}) => {
  const isButtonDisabled = disabled || isGenerating;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isButtonDisabled}
      aria-busy={isGenerating}
      aria-disabled={isButtonDisabled}
      className={`
        w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm
        flex items-center justify-center gap-2 transition-all duration-200
        select-none focus:outline-none focus:ring-2 focus:ring-amber-500/50
        ${
          isButtonDisabled
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/10 cursor-pointer'
        }
      `}
    >
      {isGenerating ? (
        <>
          {/* Animated SVG Spinner */}
          <svg
            className="animate-spin -ml-1 h-4 w-4 text-slate-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Generating Audio...</span>
        </>
      ) : (
        <>
          {/* Sparkle / Audio Icon */}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span>Generate Audio</span>
        </>
      )}
    </button>
  );
};