import { supabase } from "@/lib/supabase";

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
  todayTasks: any[];
}

class DashboardService {

  async getCurrentUserId(): Promise<string> {

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("User not logged in");
    }

    return user.id;
  }

  async getProfile(): Promise<DashboardProfile | null> {

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
  }

  async getStats(): Promise<DashboardStats> {

    const userId = await this.getCurrentUserId();

    const { data } = await supabase
      .from("dashboard_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

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
      .single();

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

    return data.map((item) => ({
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

    return data.map((book) => ({
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
      .single();

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

    return data.map((test) => ({
      id: test.id,
      title: test.title,
      score: test.score,
      total: test.total,
      accuracy: test.accuracy,
      createdAt: test.created_at,
    }));
  }
    async getTodayTasks() {

    const userId = await this.getCurrentUserId();

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", today)
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data;
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