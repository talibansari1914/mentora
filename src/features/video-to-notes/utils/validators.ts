/*
Purpose:
Provides pure validation utilities for YouTube URLs and uploaded video files.
Inputs:
- url: string
- file: File
Returns:
- boolean or error string message
Future:
Can integrate server-side validation checks or URL metadata fetchers.
*/

const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // MOV
  "video/x-msvideo", // AVI
  "video/webm",
];

const MAX_FILE_SIZE_MB = 500; // 500MB limit for MVP

/**
 * Validates whether a given string is a valid YouTube URL (Standard or Shortened).
 */
export function validateYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  // Matches youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?[^()\s]*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  return youtubeRegex.test(url.trim());
}

/**
 * Validates uploaded video file type and size.
 */
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Unsupported file format. Please upload MP4, MOV, AVI, or WEBM files.",
    };
  }

  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > MAX_FILE_SIZE_MB) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller video.`,
    };
  }

  return { isValid: true };
}