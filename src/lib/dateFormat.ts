// Shared by every place in the app that displays a date or time to the
// user, so Settings → Language & Region → Date Format / Time Format
// actually controls what's shown, instead of every page hardcoding its own
// toLocaleDateString() call with its own fixed format.

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type TimeFormat = "12-hour" | "24-hour";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Formats a date according to the user's chosen Date Format.
 * Accepts an ISO string, a Date object, or anything `new Date()` accepts.
 * Returns an empty string for invalid/missing input instead of throwing,
 * so a bad date value never crashes the page it's rendered on.
 */
export function formatDate(
  input: string | Date | null | undefined,
  format: DateFormat = "DD/MM/YYYY"
): string {
  if (!input) return "";
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return "";

  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();

  switch (format) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Formats a time according to the user's chosen Time Format.
 */
export function formatTime(
  input: string | Date | null | undefined,
  format: TimeFormat = "12-hour"
): string {
  if (!input) return "";
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return "";

  let hours = date.getHours();
  const minutes = pad2(date.getMinutes());

  if (format === "24-hour") {
    return `${pad2(hours)}:${minutes}`;
  }

  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

/** Convenience: formats a date and, on a new line/space, its time too. */
export function formatDateTime(
  input: string | Date | null | undefined,
  dateFormat: DateFormat = "DD/MM/YYYY",
  timeFormat: TimeFormat = "12-hour"
): string {
  const d = formatDate(input, dateFormat);
  const t = formatTime(input, timeFormat);
  if (!d) return "";
  return t ? `${d}, ${t}` : d;
}