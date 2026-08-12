import { createClient } from "@/lib/supabase";
import { authService } from "./authService";
import { LibraryProgress, Collection } from "@/types/book";
import { createInFlightDeduper } from "@/lib/asyncCache";

// Same cookie-aware singleton client as authService/middleware/server —
// created explicitly here (instead of importing the old backward-compat
// `supabase` export) so this file's session source is unambiguous.
const supabase = createClient();

// Pages like Library ("Personal") fire several of this class's methods at
// once via Promise.all (e.g. getAllProgress + getCollections), each of
// which independently asked "who is logged in?". Deduping getUserId()
// collapses those overlapping calls into a single auth check instead of
// one per method — see src/lib/asyncCache.ts.
const dedupeUserId = createInFlightDeduper<string>();

class LibraryService {
  private async getUserId() {
    return dedupeUserId("user-id", async () => {
      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated.");
      }

      return user.id;
    });
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
    // Defense-in-depth: scope this delete to the current user's own
    // collections (same reasoning as cancelBooking in mentorService — don't
    // rely solely on the RLS policy to prevent deleting someone else's row).
    const userId = await this.getUserId();

    const { error } = await supabase
      .from("library_collections")
      .delete()
      .eq("id", collectionId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  // Adds/removes a book from a collection's book_ids array.
  // Reads the current array first since Postgres JSONB doesn't have a
  // built-in "toggle array item" operation.
  //
  // Note: this re-fetches book_ids fresh from the DB right before computing
  // the toggle, instead of trusting the `collection` object passed in
  // (which is React state and can be stale by the time the user clicks —
  // e.g. right after a previous toggle is still in flight). This shrinks
  // the read-then-write race window down to a single network round trip
  // instead of "however long the collection has been sitting in state",
  // which covers the realistic case (a user clicking a couple of times in
  // quick succession) even though it isn't a fully atomic DB-level fix.
  async toggleBookInCollection(collection: Collection, bookId: number): Promise<Collection> {
    const userId = await this.getUserId();

    const { data: fresh, error: fetchError } = await supabase
      .from("library_collections")
      .select("book_ids")
      .eq("id", collection.id)
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;

    const currentIds: number[] = fresh?.book_ids ?? collection.book_ids ?? [];
    const nextIds = currentIds.includes(bookId)
      ? currentIds.filter((id) => id !== bookId)
      : [...currentIds, bookId];

    // Defense-in-depth: same ownership scoping as deleteCollection above.
    const { data, error } = await supabase
      .from("library_collections")
      .update({ book_ids: nextIds })
      .eq("id", collection.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return data as Collection;
  }
}

export const libraryService = new LibraryService();

export default libraryService;