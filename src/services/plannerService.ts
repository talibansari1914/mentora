import { createClient } from "@/lib/supabase";
import { authService } from "./authService";
import { createInFlightDeduper } from "@/lib/asyncCache";

// Same cookie-aware singleton client as authService/middleware/server —
// created explicitly here (instead of importing the old backward-compat
// `supabase` export) so this file's session source is unambiguous.
const supabase = createClient();

// Deduping getUserId() so that any concurrent calls to this class's
// user-scoped methods (e.g. via Promise.all) share a single auth check
// instead of each opening their own — see src/lib/asyncCache.ts.
const dedupeUserId = createInFlightDeduper<string>();

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  duration: number;
  subject: string;
  task_date: string; // YYYY-MM-DD
  done: boolean;
  created_at?: string;
}

export interface NewTask {
  title: string;
  duration: number;
  subject: string;
  task_date: string;
}

class PlannerService {
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
  // TASKS IN A DATE RANGE
  // ==========================

  async getTasksInRange(startDate: string, endDate: string): Promise<Task[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .gte("task_date", startDate)
      .lte("task_date", endDate)
      .order("task_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []) as Task[];
  }

  // ==========================
  // CREATE TASK
  // ==========================

  async createTask(task: NewTask): Promise<Task> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...task, user_id: userId, done: false })
      .select()
      .single();

    if (error) throw error;

    return data as Task;
  }

  // ==========================
  // TOGGLE DONE
  // ==========================

  async toggleDone(id: string, done: boolean): Promise<Task> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from("tasks")
      .update({ done })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return data as Task;
  }

  // ==========================
  // DELETE TASK
  // ==========================

  async deleteTask(id: string): Promise<boolean> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    return true;
  }

  // ==========================
  // AUTO RESCHEDULE MISSED TASKS
  // Moves any incomplete task with a past task_date to today
  // ==========================

  async rescheduleMissedTasks(): Promise<number> {
    const userId = await this.getUserId();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("done", false)
      .lt("task_date", today);

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    const ids = data.map((t: { id: string }) => t.id);

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ task_date: today })
      .in("id", ids);

    if (updateError) throw updateError;

    return ids.length;
  }
}

export const plannerService = new PlannerService();

export default plannerService;