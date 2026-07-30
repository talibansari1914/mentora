// Shared type definitions for the Library feature.
// Kept in one place so every library component/page uses the exact same shape.

export interface Book {
  id: number;
  title: string;
  author: string;
  exam: string;
  type: string;
  pages: number;
  rating: number;
  downloads: string;
  icon: string;
  isNew: boolean;
  premium: boolean;
  pdfUrl: string | null;
}

// Per-user reading state for a book (mirrors the `library_progress` Supabase table).
export interface LibraryProgress {
  book_id: string;
  progress_percent: number;
  is_favorite: boolean;
  is_wishlisted: boolean;
  last_opened_at: string;
}

// A user-created folder that groups books together (mirrors `library_collections`).
export interface Collection {
  id: string;
  user_id?: string;
  name: string;
  book_ids: number[];
  created_at?: string;
}