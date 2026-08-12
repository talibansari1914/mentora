import { createClient } from "@/lib/supabase";
import { authService } from "./authService";
import { createInFlightDeduper } from "@/lib/asyncCache";

// Same cookie-aware singleton client as authService/middleware/server —
// created explicitly here (instead of importing the old backward-compat
// `supabase` export) so this file's session source is unambiguous.
const supabase = createClient();

// getDashboardAnalytics() and the Analytics page both fire several of this
// class's methods at once via Promise.all (e.g. getPerformanceSummary +
// getWeeklyPerformance + getSubjectTrend), and every one of them calls
// getAllResults() with the same exam filter underneath — so the exact same
// full test-results query was being sent to Supabase 3-6 times in parallel
// on a single page load. Deduping getAllResults() by its exam key means
// those overlapping calls now share one query instead of repeating it; see
// src/lib/asyncCache.ts.
const dedupeUserId = createInFlightDeduper<string>();
const dedupeAllResults = createInFlightDeduper<TestResult[]>();

export interface SubjectPerformance {
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  accuracy: number;
}

export interface SubjectBreakdown {
  [subject: string]: SubjectPerformance;
}

export interface TestResult {
  id?: string;
  user_id?: string;
  test_id: string;
  title: string;
  exam: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  time_used: number;
  subject_breakdown: SubjectBreakdown;
  created_at?: string;
}

export interface WeeklyPerformance {
  date: string;
  score: number;
  accuracy: number;
  tests: number;
}

export interface MonthlyPerformance {
  month: string;
  averageScore: number;
  averageAccuracy: number;
  tests: number;
}

export interface SubjectTrend {
  subject: string;
  tests: number;
  averageAccuracy: number;
  averageScore: number;
  correct: number;
  wrong: number;
  skipped: number;
}

export interface PerformanceSummary {
  totalTests: number;
  averageScore: number;
  averageAccuracy: number;
  bestScore: number;
  highestAccuracy: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
}

class TestService {
  // ==========================
  // EXAM NORMALIZER
  // ==========================
  private normalizeExam(exam?: string): string {
    return exam ? exam.trim().toUpperCase() : "";
  }

  // ==========================
  // CURRENT USER
  // ==========================
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
  // SAVE RESULT
  // ==========================
  async saveResult(result: TestResult) {
    const userId = await this.getUserId();
    const payload = {
      ...result,
      user_id: userId,
      exam: this.normalizeExam(result.exam),
    };

    const { data, error } = await supabase
      .from("test_results")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==========================
  // GET SINGLE RESULT
  // ==========================
  async getResult(id: string) {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from("test_results")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data as TestResult;
  }

  // ==========================
  // RECENT TESTS
  // ==========================
  async getRecentResults(exam?: string, limit: number = 5) {
    const userId = await this.getUserId();
    let query = supabase
      .from("test_results")
      .select("*")
      .eq("user_id", userId);

    if (exam) {
      query = query.eq("exam", this.normalizeExam(exam));
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as TestResult[];
  }

  // ==========================
  // ALL RESULTS
  // ==========================
  async getAllResults(exam?: string) {
    const dedupeKey = exam ? this.normalizeExam(exam) : "__all__";

    return dedupeAllResults(dedupeKey, async () => {
      const userId = await this.getUserId();
      let query = supabase
        .from("test_results")
        .select("*")
        .eq("user_id", userId);

      if (exam) {
        query = query.eq("exam", this.normalizeExam(exam));
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      return (data ?? []) as TestResult[];
    });
  }

  // ==========================
  // DELETE RESULT
  // ==========================
  async deleteResult(id: string) {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from("test_results")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  }

  // ==========================
  // TOTAL TEST COUNT
  // ==========================
  async getTotalTests(exam?: string) {
    const results = await this.getAllResults(exam);
    return results.length;
  }

  // ==========================
  // BEST SCORE
  // ==========================
  async getBestScore(exam?: string) {
    const results = await this.getAllResults(exam);
    if (!results.length) return 0;
    return Math.max(...results.map((item) => item.score));
  }

  // ==========================
  // PERFORMANCE SUMMARY
  // ==========================
  async getPerformanceSummary(exam?: string): Promise<PerformanceSummary> {
    const results = await this.getAllResults(exam);

    if (!results.length) {
      return {
        totalTests: 0,
        averageScore: 0,
        averageAccuracy: 0,
        bestScore: 0,
        highestAccuracy: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalSkipped: 0,
      };
    }

    const totalTests = results.length;
    const totalScore = results.reduce((sum, test) => sum + test.score, 0);
    const totalAccuracy = results.reduce((sum, test) => sum + test.accuracy, 0);
    const totalCorrect = results.reduce((sum, test) => sum + test.correct, 0);
    const totalWrong = results.reduce((sum, test) => sum + test.wrong, 0);
    const totalSkipped = results.reduce((sum, test) => sum + test.skipped, 0);

    return {
      totalTests,
      averageScore: Number((totalScore / totalTests).toFixed(2)),
      averageAccuracy: Number((totalAccuracy / totalTests).toFixed(2)),
      bestScore: Math.max(...results.map((t) => t.score)),
      highestAccuracy: Math.max(...results.map((t) => t.accuracy)),
      totalCorrect,
      totalWrong,
      totalSkipped,
    };
  }

  // ==========================
  // WEEKLY PERFORMANCE
  // ==========================
  async getWeeklyPerformance(exam?: string): Promise<WeeklyPerformance[]> {
    const results = await this.getAllResults(exam);
    const map = new Map<string, WeeklyPerformance>();

    results.forEach((test) => {
      const date = new Date(test.created_at!).toISOString().split("T")[0];

      if (!map.has(date)) {
        map.set(date, { date, score: 0, accuracy: 0, tests: 0 });
      }

      const current = map.get(date)!;
      current.tests += 1;
      current.score += test.score;
      current.accuracy += test.accuracy;
    });

    return [...map.values()]
      .map((item) => ({
        ...item,
        score: Number((item.score / item.tests).toFixed(2)),
        accuracy: Number((item.accuracy / item.tests).toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ==========================
  // MONTHLY PERFORMANCE
  // ==========================
  async getMonthlyPerformance(exam?: string): Promise<MonthlyPerformance[]> {
    const results = await this.getAllResults(exam);
    const map = new Map<string, MonthlyPerformance>();

    results.forEach((test) => {
      const month = new Date(test.created_at!).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!map.has(month)) {
        map.set(month, { month, averageScore: 0, averageAccuracy: 0, tests: 0 });
      }

      const current = map.get(month)!;
      current.tests += 1;
      current.averageScore += test.score;
      current.averageAccuracy += test.accuracy;
    });

    return [...map.values()].map((item) => ({
      ...item,
      averageScore: Number((item.averageScore / item.tests).toFixed(2)),
      averageAccuracy: Number((item.averageAccuracy / item.tests).toFixed(2)),
    }));
  }

  // ==========================
  // SUBJECT TREND
  // ==========================
  async getSubjectTrend(exam?: string): Promise<SubjectTrend[]> {
    const results = await this.getAllResults(exam);
    const subjectMap = new Map<string, SubjectTrend>();

    for (const test of results) {
      const breakdown = test.subject_breakdown ?? {};

      for (const [subject, stats] of Object.entries(breakdown)) {
        const subjectStats = stats as SubjectPerformance;

        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, {
            subject,
            tests: 0,
            averageAccuracy: 0,
            averageScore: 0,
            correct: 0,
            wrong: 0,
            skipped: 0,
          });
        }

        const current = subjectMap.get(subject)!;
        current.tests += 1;
        current.correct += subjectStats.correct;
        current.wrong += subjectStats.wrong;
        current.skipped += subjectStats.skipped;
        current.averageAccuracy += subjectStats.accuracy;

        if (subjectStats.total > 0) {
          current.averageScore += Number(
            ((subjectStats.correct / subjectStats.total) * 100).toFixed(2)
          );
        }
      }
    }

    return [...subjectMap.values()]
      .map((subject) => ({
        ...subject,
        averageAccuracy: Number((subject.averageAccuracy / subject.tests).toFixed(2)),
        averageScore: Number((subject.averageScore / subject.tests).toFixed(2)),
      }))
      .sort((a, b) => b.averageAccuracy - a.averageAccuracy);
  }

  // ==========================
  // STRONG & WEAK SUBJECTS
  // ==========================
  async getStrongSubjects(exam?: string, limit = 5) {
    const subjects = await this.getSubjectTrend(exam);
    return subjects.filter((item) => item.tests > 0).slice(0, limit);
  }

  async getWeakSubjects(exam?: string, limit = 5) {
    const subjects = await this.getSubjectTrend(exam);
    return [...subjects].sort((a, b) => a.averageAccuracy - b.averageAccuracy).slice(0, limit);
  }

  // ==========================
  // FOCUS AREAS
  // ==========================
  async getFocusAreas(exam?: string) {
    const weakSubjects = await this.getWeakSubjects(exam, 5);
    return weakSubjects.map((subject) => ({
      subject: subject.subject,
      accuracy: subject.averageAccuracy,
      tests: subject.tests,
      priority:
        subject.averageAccuracy < 40
          ? "High"
          : subject.averageAccuracy < 70
          ? "Medium"
          : "Low",
    }));
  }

  // ==========================
  // TREND ANALYTICS
  // ==========================
  async getAccuracyTrend(exam?: string) {
    const results = await this.getAllResults(exam);
    return results
      .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
      .map((item) => ({
        testId: item.test_id,
        title: item.title,
        accuracy: item.accuracy,
        date: item.created_at,
      }));
  }

  async getScoreTrend(exam?: string) {
    const results = await this.getAllResults(exam);
    return results
      .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
      .map((item) => ({
        testId: item.test_id,
        title: item.title,
        score: item.score,
        total: item.total,
        percentage: Number(((item.score / item.total) * 100).toFixed(2)),
        date: item.created_at,
      }));
  }

  // ==========================
  // DASHBOARD ANALYTICS
  // ==========================
  async getDashboardAnalytics(exam?: string) {
    const [
      summary,
      recentTests,
      weeklyPerformance,
      monthlyPerformance,
      strongSubjects,
      weakSubjects,
    ] = await Promise.all([
      this.getPerformanceSummary(exam),
      this.getRecentResults(exam, 5),
      this.getWeeklyPerformance(exam),
      this.getMonthlyPerformance(exam),
      this.getStrongSubjects(exam),
      this.getWeakSubjects(exam),
    ]);

    return {
      summary,
      recentTests,
      weeklyPerformance,
      monthlyPerformance,
      strongSubjects,
      weakSubjects,
    };
  }

  async refresh() {
    return true;
  }
}

export const testService = new TestService();
export default testService;