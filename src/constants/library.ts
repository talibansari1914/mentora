// ══════════════════════════════════════════
// Filter option lists
// ══════════════════════════════════════════
export const EXAMS = ["All", "UPSC", "JEE", "NEET", "SSC", "Engineering"];
export const TYPES = ["All Types", "Books", "Notes", "PYQs", "Magazines", "Newspapers"];

// ══════════════════════════════════════════
// Consistent color-per-exam mapping.
// Every book's category always maps to the same color, so the grid
// reads as organized categories instead of a random rainbow.
// ══════════════════════════════════════════
export const EXAM_COLORS: Record<string, string> = {
  UPSC: "linear-gradient(135deg,#F59E0B,#FBBF24)", // amber — matches the app's main brand color
  JEE: "linear-gradient(135deg,#3B82F6,#06B6D4)", // blue
  NEET: "linear-gradient(135deg,#10B981,#059669)", // green
  SSC: "linear-gradient(135deg,#8B5CF6,#A855F7)", // purple
  Engineering: "linear-gradient(135deg,#EC4899,#F43F5E)", // rose
};

export function examColor(exam: string) {
  return EXAM_COLORS[exam] ?? "linear-gradient(135deg,#64748B,#475569)";
}

// NOTE: The book catalog (previously a hardcoded BOOKS array here) now
// lives in the Supabase "books" table. Use `bookService.getAllBooks()`
// (src/services/bookService.ts) to fetch it instead.