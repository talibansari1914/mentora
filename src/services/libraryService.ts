import { supabase } from "@/lib/supabase";
import { authService } from "./authService";
import { LibraryProgress, Collection } from "@/types/book";

class LibraryService {
  private async getUserId() {
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error("User not authenticated.");
    }

    return user.id;
  }

  // ==========================
  // GET ALL PROGRESS ROWS FOR THE CURRENT USER
  // Used to derive favorites, wishlist, and "Continue Reading" on the client.
  // ==========================

  async getAllProgress(): Promise<LibraryProgress[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("library_progress")
      .select("*")
      .eq("user_id", userId)
      .order("last_opened_at", { ascending: false });

    if (error) throw error;

    return (data ?? []) as LibraryProgress[];
  }

  // ==========================
  // TOGGLE FAVORITE
  // Upserts so it works whether or not a progress row already exists for this book.
  // ==========================

  async toggleFavorite(bookId: string, nextValue: boolean): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from("library_progress")
      .upsert(
        { user_id: userId, book_id: bookId, is_favorite: nextValue },
        { onConflict: "user_id,book_id" }
      );

    if (error) throw error;
  }

  // ==========================
  // TOGGLE WISHLIST
  // ==========================

  async toggleWishlist(bookId: string, nextValue: boolean): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from("library_progress")
      .upsert(
        { user_id: userId, book_id: bookId, is_wishlisted: nextValue },
        { onConflict: "user_id,book_id" }
      );

    if (error) throw error;
  }

  // ==========================
  // MARK A BOOK AS OPENED (updates "Continue Reading" recency + progress)
  // ==========================

  async recordOpen(bookId: string, progressPercent: number): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase.from("library_progress").upsert(
      {
        user_id: userId,
        book_id: bookId,
        progress_percent: progressPercent,
        last_opened_at: new Date().toISOString(),
      },
      { onConflict: "user_id,book_id" }
    );

    if (error) throw error;
  }

  // ==========================
  // MARK A BOOK AS COMPLETED (100%)
  // ==========================

  async markCompleted(bookId: string): Promise<void> {
    await this.recordOpen(bookId, 100);
  }

  // ==========================
  // COLLECTIONS (custom folders)
  // ==========================

  async getCollections(): Promise<Collection[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("library_collections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []) as Collection[];
  }

  async createCollection(name: string): Promise<Collection> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("library_collections")
      .insert({ user_id: userId, name, book_ids: [] })
      .select()
      .single();

    if (error) throw error;

    return data as Collection;
  }

  async deleteCollection(collectionId: string): Promise<void> {
    const { error } = await supabase.from("library_collections").delete().eq("id", collectionId);

    if (error) throw error;
  }

  // Adds/removes a book from a collection's book_ids array.
  // Reads the current array first since Postgres JSONB doesn't have a
  // built-in "toggle array item" operation.
  async toggleBookInCollection(collection: Collection, bookId: number): Promise<Collection> {
    const currentIds: number[] = collection.book_ids ?? [];
    const nextIds = currentIds.includes(bookId)
      ? currentIds.filter((id) => id !== bookId)
      : [...currentIds, bookId];

    const { data, error } = await supabase
      .from("library_collections")
      .update({ book_ids: nextIds })
      .eq("id", collection.id)
      .select()
      .single();

    if (error) throw error;

    return data as Collection;
  }
}

export const libraryService = new LibraryService();

export default libraryService;