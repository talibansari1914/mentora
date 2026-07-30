/*
  Purpose:
    Renders a dedicated download button that triggers saving the generated
    audio track to the user's local device as an MP3 file.
  Input:
    audioUrl (string): The URL of the generated audio track.
    format (string, optional): Audio format extension ('mp3' | 'wav' | 'ogg'). Defaults to 'mp3'.
    fileName (string, optional): Default filename for saving.
    disabled (boolean, optional): Whether download should be disabled.
  Outputs:
    React component rendering an accessible download button.
  Error Handling:
    - Safely handles cross-origin URLs by creating a temporary programmatic anchor link.
  Future:
    Can be upgraded to fetch the blob directly and display a download progress bar for large files.
*/

import React from 'react';

export interface DownloadButtonProps {
  audioUrl: string;
  format?: 'mp3' | 'wav' | 'ogg';
  fileName?: string;
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  audioUrl,
  format = 'mp3',
  fileName = 'mentora-speech',
  disabled = false
}) => {
  const handleDownload = () => {
    if (disabled || !audioUrl) return;

    // Create a temporary link element to trigger the browser download
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${fileName}.${format}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || !audioUrl}
      aria-label="Download generated audio"
      className={`
        px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center
        gap-2 border transition-all duration-200 select-none
        focus:outline-none focus:ring-2 focus:ring-amber-500/50
        ${
          disabled || !audioUrl
            ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-amber-400 cursor-pointer'
        }
      `}
    >
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
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span>Download MP3</span>
    </button>
  );
};