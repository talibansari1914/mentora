import { createClient } from "@/lib/supabase";
import { createInFlightDeduper } from "@/lib/asyncCache";
import type { Task } from "@/services/plannerService";

// Same cookie-aware singleton client as authService/middleware/server —
// created explicitly here (instead of importing the old backward-compat
// `supabase` export) so this file's session source is unambiguous. This is
// the exact client this service's getCurrentUserId() reads the session
// from, so it now sees the same login state as the rest of the app.
const supabase = createClient();

// getDashboard() below fires 8 of this class's methods at once via
// Promise.all, and several of them independently call getCurrentUserId()
// and/or getProfile() to answer the same "who is this, and what's their
// profile" question at the same moment. These dedupers collapse those
// overlapping calls into a single underlying request each, instead of each
// method opening its own auth round trip / profile query — this was the
// main reason the dashboard felt slow to load. See src/lib/asyncCache.ts.
const dedupeUserId = createInFlightDeduper<string>();
const dedupeProfile = createInFlightDeduper<DashboardProfile | null>();

export interface DashboardStats {
  totalStudyTime: number;
  completedTasks: number;
  totalTasks: number;
  mockTests: number;
}

export interface DashboardProfile {
  id: string;
  fullName: string;
  firstName: string;
  exam: string;
  streak: number;
}

export interface RankData {
  nationalRank: number;
  stateRank: number;
  cityRank: number;
  percentile: number;
}

export interface FocusArea {
  id: string;
  subject: string;
  score: number;
  level: "low" | "medium" | "high";
}

export interface ContinueReadingBook {
  id: string;
  title: string;
  chapter: number;
  totalChapters: number;
  progress: number;
}

export interface StudyStreak {
  current: number;
  longest: number;
  totalDays: number;
  lastStudyDate: string | null;
}

export interface RecentTest {
  id: string;
  title: string;
  score: number;
  total: number;
  accuracy: number;
  createdAt: string;
}

export interface DashboardData {
  profile: DashboardProfile | null;
  stats: DashboardStats;
  rank: RankData | null;
  focusAreas: FocusArea[];
  continueReading: ContinueReadingBook[];
  recentTests: RecentTest[];
  studyStreak: StudyStreak | null;
  todayTasks: Task[];
}

// Raw Supabase row shapes (snake_case) for the tables this service reads
// from directly — mirrors the columns defined in the migrations.
interface FocusAreaRow {
  id: string;
  subject: string;
  score: number;
  level: "low" | "medium" | "high";
}

interface ContinueReadingRow {
  book_id: string;
  book_title: string;
  chapter: number;
  total_chapters: number;
  progress: number;
}

interface RecentTestRow {
  id: string;
  title: string;
  score: number;
  total: number;
  accuracy: number;
  created_at: string;
}

class DashboardService {

  async getCurrentUserId(): Promise<string> {
    return dedupeUserId("user-id", async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new Error("User not logged in");
      }

      return user.id;
    });
  }

  async getProfile(): Promise<DashboardProfile | null> {
    return dedupeProfile("profile", async () => {
      const userId = await this.getCurrentUserId();

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) return null;

      return {
        id: data.id,
        fullName: data.full_name,
        firstName: data.first_name,
        exam: data.exam,
        streak: data.streak,
      };
    });
  }

  async getStats(): Promise<DashboardStats> {

    const userId = await this.getCurrentUserId();

    const { data } = await supabase
      .from("dashboard_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) {
      return {
        totalStudyTime: 0,
        completedTasks: 0,
        totalTasks: 0,
        mockTests: 0,
      };
    }

    return {
      totalStudyTime: data.total_study_time,
      completedTasks: data.completed_tasks,
      totalTasks: data.total_tasks,
      mockTests: data.mock_tests,
    };
  }

  async getRank(): Promise<RankData | null> {

    const userId = await this.getCurrentUserId();

    const { data } = await supabase
      .from("rankings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return null;

    return {
      nationalRank: data.national_rank,
      stateRank: data.state_rank,
      cityRank: data.city_rank,
      percentile: Number(data.percentile),
    };
  }
    async getFocusAreas(): Promise<FocusArea[]> {

    const userId = await this.getCurrentUserId();

    const profile = await this.getProfile();

    if (!profile) return [];

    const { data, error } = await supabase
      .from("focus_areas")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_slug", profile.exam)
      .order("score", { ascending: true });

    if (error || !data) return [];

    return (data as FocusAreaRow[]).map((item) => ({
      id: item.id,
      subject: item.subject,
      score: item.score,
      level: item.level,
    }));
  }

  async getContinueReading(): Promise<ContinueReadingBook[]> {

    const userId = await this.getCurrentUserId();

    const profile = await this.getProfile();

    if (!profile) return [];

    const { data, error } = await supabase
      .from("books_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_slug", profile.exam)
      .order("last_read_at", { ascending: false });

    if (error || !data) return [];

    return (data as ContinueReadingRow[]).map((book) => ({
      id: book.book_id,
      title: book.book_title,
      chapter: book.chapter,
      totalChapters: book.total_chapters,
      progress: book.progress,
    }));
  }

  async getStudyStreak(): Promise<StudyStreak | null> {

    const userId = await this.getCurrentUserId();

    const profile = await this.getProfile();

    if (!profile) return null;

    const { data, error } = await supabase
      .from("study_streak")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_slug", profile.exam)
      .maybeSingle();

    if (error || !data) return null;

    return {
      current: data.current_streak,
      longest: data.longest_streak,
      totalDays: data.total_study_days,
      lastStudyDate: data.last_study_date,
    };
  }

  async getRecentTests(): Promise<RecentTest[]> {

    const userId = await this.getCurrentUserId();

    const profile = await this.getProfile();

    if (!profile) return [];

    const { data, error } = await supabase
      .from("test_results")
      .select("*")
      .eq("user_id", userId)
      .eq("exam", profile.exam)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data) return [];

    return (data as RecentTestRow[]).map((test) => ({
      id: test.id,
      title: test.title,
      score: test.score,
      total: test.total,
      accuracy: test.accuracy,
      createdAt: test.created_at,
    }));
  }
    async getTodayTasks(): Promise<Task[]> {

    const userId = await this.getCurrentUserId();

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", today)
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data as Task[];
  }

  async getDashboard(): Promise<DashboardData> {

    const [
      profile,
      stats,
      rank,
      focusAreas,
      continueReading,
      recentTests,
      studyStreak,
      todayTasks,
    ] = await Promise.all([
      this.getProfile(),
      this.getStats(),
      this.getRank(),
      this.getFocusAreas(),
      this.getContinueReading(),
      this.getRecentTests(),
      this.getStudyStreak(),
      this.getTodayTasks(),
    ]);

    return {
      profile,
      stats,
      rank,
      focusAreas,
      continueReading,
      recentTests,
      studyStreak,
      todayTasks,
    };
  }
}

const dashboardService = new DashboardService();

export default dashboardService;