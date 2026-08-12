import dashboardService, { DashboardData } from "./dashboardService";
import { testService } from "./testService";
import { plannerService } from "./plannerService";
import { memoryService } from "./memoryService";
import { settingsService } from "./settingsService";

// ==========================================================
// In-app notifications
// ==========================================================
// Settings → Notifications currently only saves the user's preference —
// its own hint text says delivery isn't wired up yet. This service is the
// first real delivery channel: an in-app notification (bell icon in the
// dashboard header), computed live from data that already exists in the
// app, respecting whichever toggles the user has turned on.
//
// These are NOT persisted in a database table — each one is recomputed
// from the user's current data every time the bell is opened, using the
// exact same services the rest of the app already reads from (planner
// tasks, memory/revision items, test results, study streak). "Dismissed"
// state is remembered per-browser in localStorage (see dismissedIds
// below), the same lightweight pattern already used for theme/accent/font
// size in this app — no new backend table needed for that either.
//
// Email and push notifications (the other two Settings → Notifications
// toggles) are a separate, larger piece of work — they need a transactional
// email provider account and/or push subscription infrastructure that
// doesn't exist in this codebase yet, so they're intentionally not covered
// here.

export type NotificationType =
  | "dailyReminder"
  | "mockTestReminder"
  | "assignmentReminder"
  | "revisionReminder"
  | "achievement";

export interface AppNotification {
  // Stable across a given day so a dismissed notification doesn't
  // reappear until there's something genuinely new to say.
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

// Streak milestones worth celebrating. Only fires on the exact day the
// milestone is reached (checked against dashboard.studyStreak.current),
// so it shows once, not on every subsequent day at that streak length.
const STREAK_MILESTONES = [7, 14, 30, 50, 100, 200, 365];

class NotificationService {
  async getNotifications(): Promise<AppNotification[]> {
    const settings = await settingsService.getSettings();
    const prefs = settings.notifications;

    // dailyReminder, mockTestReminder, and achievement checks all need the
    // same dashboard data (studyStreak, profile.exam) — fetch it once up
    // front instead of letting each check call getDashboard() on its own,
    // which would otherwise fire the same query 2-3 times in parallel.
    const needsDashboard = prefs.dailyReminder || prefs.mockTestReminder || prefs.achievementNotifications;
    const dashboard = needsDashboard ? await dashboardService.getDashboard() : null;

    // Every check below is independent and wrapped so one failing service
    // (e.g. the user has no planner tasks table access for some reason)
    // never breaks the others — the bell should always show whatever it
    // safely can.
    const checks: Promise<AppNotification | null>[] = [];

    if (prefs.dailyReminder) checks.push(this.checkDailyReminder(dashboard));
    if (prefs.mockTestReminder) checks.push(this.checkMockTestReminder(dashboard));
    if (prefs.assignmentReminder) checks.push(this.checkAssignmentReminder());
    if (prefs.revisionReminder) checks.push(this.checkRevisionReminder());
    if (prefs.achievementNotifications) checks.push(this.checkAchievement(dashboard));

    const settled = await Promise.allSettled(checks);
    const notifications: AppNotification[] = [];
    for (const result of settled) {
      if (result.status === "fulfilled" && result.value) {
        notifications.push(result.value);
      }
    }
    return notifications;
  }

  private async checkDailyReminder(dashboard: DashboardData | null): Promise<AppNotification | null> {
    const lastStudyDate = dashboard?.studyStreak?.lastStudyDate;
    if (lastStudyDate === todayStr()) return null; // already studied today

    return {
      id: `daily-${todayStr()}`,
      type: "dailyReminder",
      title: "Daily study reminder",
      message: dashboard?.studyStreak?.current
        ? `You haven't studied today yet — keep your ${dashboard.studyStreak.current}-day streak going!`
        : "You haven't studied today yet — start your streak!",
    };
  }

  private async checkMockTestReminder(dashboard: DashboardData | null): Promise<AppNotification | null> {
    const exam = dashboard?.profile?.exam;
    const recent = await testService.getRecentResults(exam, 1);
    const lastTest = recent?.[0];

    // No test taken yet at all, or it's been 5+ days since the last one.
    const daysSince = lastTest?.created_at ? daysBetween(lastTest.created_at, new Date().toISOString()) : Infinity;
    if (daysSince < 5) return null;

    return {
      id: `mocktest-${todayStr()}`,
      type: "mockTestReminder",
      title: "Mock test reminder",
      message: lastTest
        ? `It's been ${daysSince} days since your last mock test — take one today to track your progress.`
        : "You haven't taken a mock test yet — try one to see where you stand.",
    };
  }

  private async checkAssignmentReminder(): Promise<AppNotification | null> {
    const today = todayStr();
    const tasks = await plannerService.getTasksInRange(today, today);
    const pending = tasks.filter((t) => !t.done);
    if (pending.length === 0) return null;

    return {
      id: `tasks-${today}`,
      type: "assignmentReminder",
      title: "Pending tasks today",
      message:
        pending.length === 1
          ? `You have 1 pending task today: "${pending[0].title}".`
          : `You have ${pending.length} pending tasks today.`,
    };
  }

  private async checkRevisionReminder(): Promise<AppNotification | null> {
    const due = await memoryService.getDueItems();
    if (due.length === 0) return null;

    return {
      id: `revision-${todayStr()}`,
      type: "revisionReminder",
      title: "Revision due",
      message:
        due.length === 1
          ? `"${due[0].title}" is due for revision.`
          : `${due.length} topics are due for revision.`,
    };
  }

  private async checkAchievement(dashboard: DashboardData | null): Promise<AppNotification | null> {
    const current = dashboard?.studyStreak?.current ?? 0;
    if (!STREAK_MILESTONES.includes(current)) return null;

    return {
      // Tied to the streak count itself (not the date), so it only ever
      // fires once per milestone, not once per day at that streak length.
      id: `streak-milestone-${current}`,
      type: "achievement",
      title: "Achievement unlocked",
      message: `🎉 ${current}-day study streak! Keep it up.`,
    };
  }

  // ==========================
  // Dismissed-state (per browser, not per account — see file header)
  // ==========================
  private readonly DISMISSED_KEY = "mentora_dismissed_notifications";

  getDismissedIds(): string[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(this.DISMISSED_KEY) || "[]");
    } catch {
      return [];
    }
  }

  dismiss(id: string) {
    const dismissed = new Set(this.getDismissedIds());
    dismissed.add(id);
    try {
      localStorage.setItem(this.DISMISSED_KEY, JSON.stringify([...dismissed]));
    } catch {
      // Not fatal — the notification may just reappear next visit.
    }
  }
}

export const notificationService = new NotificationService();

export default notificationService;