import { supabase } from "@/lib/supabase";
import { authService } from "./authService";

export interface RevisionItem {
  id: string;
  user_id?: string;
  title: string;
  subject: string;
  exam: string;
  repetitions: number;
  ease_factor: number;
  interval_days: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  created_at?: string;
}

export interface NewRevisionItem {
  title: string;
  subject: string;
  exam: string;
}

// Review quality: 2 = Hard, 4 = Good, 5 = Easy
export type ReviewQuality = 2 | 4 | 5;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function addDaysStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// SM-2 spaced repetition algorithm
function computeNextSchedule(item: RevisionItem, quality: ReviewQuality) {
  let { repetitions, ease_factor, interval_days } = item;

  if (quality < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  }

  ease_factor =
    ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  return {
    repetitions,
    ease_factor: Number(ease_factor.toFixed(2)),
    interval_days,
    last_reviewed_at: todayStr(),
    next_review_at: addDaysStr(interval_days),
  };
}

class MemoryService {
  private async getUserId() {
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error("User not authenticated.");
    }

    return user.id;
  }

  // ==========================
  // DUE TODAY (or overdue)
  // ==========================

  async getDueItems(): Promise<RevisionItem[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("revision_items")
      .select("*")
      .eq("user_id", userId)
      .lte("next_review_at", todayStr())
      .order("next_review_at", { ascending: true });

    if (error) throw error;

    return (data ?? []) as RevisionItem[];
  }

  // ==========================
  // UPCOMING (future scheduled)
  // ==========================

  async getUpcomingItems(): Promise<RevisionItem[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("revision_items")
      .select("*")
      .eq("user_id", userId)
      .gt("next_review_at", todayStr())
      .order("next_review_at", { ascending: true })
      .limit(20);

    if (error) throw error;

    return (data ?? []) as RevisionItem[];
  }

  // ==========================
  // ADD ITEM
  // ==========================

  async addItem(item: NewRevisionItem): Promise<RevisionItem> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("revision_items")
      .insert({
        ...item,
        user_id: userId,
        repetitions: 0,
        ease_factor: 2.5,
        interval_days: 1,
        next_review_at: todayStr(),
      })
      .select()
      .single();

    if (error) throw error;

    return data as RevisionItem;
  }

  // ==========================
  // REVIEW ITEM (updates schedule via SM-2)
  // ==========================

  async reviewItem(item: RevisionItem, quality: ReviewQuality): Promise<RevisionItem> {
    const schedule = computeNextSchedule(item, quality);

    const { data, error } = await supabase
      .from("revision_items")
      .update(schedule)
      .eq("id", item.id)
      .select()
      .single();

    if (error) throw error;

    return data as RevisionItem;
  }

  // ==========================
  // DELETE ITEM
  // ==========================

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from("revision_items").delete().eq("id", id);

    if (error) throw error;

    return true;
  }
}

export const memoryService = new MemoryService();

export default memoryService;