import { createClient } from "@/lib/supabase";
import { Book } from "@/types/book";

// Same cookie-aware singleton client as authService/middleware/server —
// created explicitly here (instead of importing the old backward-compat
// `supabase` export) so this file's session source is unambiguous.
const supabase = createClient();

// Raw Supabase row shape (snake_case) for the `books` table.
interface BookRow {
  id: number;
  title: string;
  author: string;
  exam: string;
  type: string;
  pages: number;
  rating: number;
  downloads: string;
  icon: string;
  is_new: boolean;
  premium: boolean;
  pdf_url: string | null;
}

// Converts a raw Supabase row (snake_case) into our Book type (camelCase).
function mapRow(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    exam: row.exam,
    type: row.type,
    pages: row.pages,
    rating: Number(row.rating),
    downloads: row.downloads,
    icon: row.icon,
    isNew: row.is_new,
    premium: row.premium,
    pdfUrl: row.pdf_url,
  };
}

class BookService {
  // ==========================
  // GET ALL BOOKS
  // ==========================

  async getAllBooks(): Promise<Book[]> {
    const { data, error } = await supabase.from("books").select("*").order("id", { ascending: true });

    if (error) throw error;

    return (data ?? []).map(mapRow);
  }

  // ==========================
  // GET ONE BOOK BY ID
  // ==========================

  async getBookById(id: number): Promise<Book | null> {
    const { data, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();

    if (error) throw error;

    return data ? mapRow(data) : null;
  }
}

export const bookService = new BookService();

export default bookService;