import { supabase } from "@/lib/supabase";
import { Book } from "@/types/book";

// Converts a raw Supabase row (snake_case) into our Book type (camelCase).
function mapRow(row: any): Book {
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