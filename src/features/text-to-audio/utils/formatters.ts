/*
  Purpose:
    Converts time in seconds to an MM:SS string for the Audio Player component.
  Input:
    seconds (number): Total seconds (e.g., 125.4).
  Outputs:
    string: Formatted timestamp (e.g., "02:05").
  Error Handling:
    - Handles NaN, Infinity, negative numbers, or undefined by returning "00:00".
  Future:
    Can be extended to HH:MM:SS if longer audio generation is supported later.
*/

export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}`;
};