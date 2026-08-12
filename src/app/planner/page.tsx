"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { plannerService, Task } from "@/services/plannerService";
import { settingsService } from "@/services/settingsService";
import { gradAmber, gradTextAmber } from "@/lib/theme";
import BackToDashboardLink from "@/components/common/BackToDashboardLink";
import { getErrorMessage } from "@/lib/errors";

const G = { grad: gradAmber, gradText: gradTextAmber };

const EXAMS = [
  { value: "upsc", label: "UPSC" },
  { value: "jee", label: "JEE" },
  { value: "neet", label: "NEET" },
  { value: "ssc", label: "SSC" },
];

type View = "daily" | "weekly" | "monthly";

const EXAM_DATE_KEY = "mentora_exam_date";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

// Static theme-token style map — driven entirely by the shared --theme-* CSS
// variables set on <html data-theme="dark|light">, so this page always mirrors
// the dashboard toggle exactly with zero extra JS/state.
const themeStyles = {
  bg: "var(--theme-bg-main)",
  color: "var(--theme-text-main)",
  subText: "var(--theme-text-sub)",
  mutedText: "var(--theme-text-sub)",
  cardBg: "var(--theme-card-bg)",
  cardBorder: "1px solid var(--theme-border)",
  inputBg: "var(--theme-card-bg)",
  inputColor: "var(--theme-text-main)",
  inputBorder: "1px solid var(--theme-border)",
  tabBorder: "var(--theme-border)",
  progressBarBg: "var(--theme-border)",
  checkboxBorder: "var(--theme-border)",
};

export default function StudyPlannerPage() {
  const [view, setView] = useState<View>("daily");

  const [dailyDate, setDailyDate] = useState(new Date());
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [monthAnchor, setMonthAnchor] = useState(new Date());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [examDate, setExamDate] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newExam, setNewExam] = useState("upsc");
  const [newDuration, setNewDuration] = useState(30);
  // Guards handleAddTask against double-submit — without this, a fast
  // double-click/tap (or a slow network) could fire createTask() twice
  // before the first call resolves, creating a duplicate task.
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [rescheduledCount, setRescheduledCount] = useState(0);

  // Tracks whether this component is still mounted, so loadTasks() and the
  // reschedule effect below don't call setState after the user has already
  // navigated away from this page.
  const isMountedRef = useRef(true);
  useEffect(() => {
    // React StrictMode (dev only) double-invokes this effect: mount ->
    // cleanup -> mount again. Without resetting to `true` here, the first
    // (StrictMode-only) cleanup would permanently leave this `false` even
    // though the component is genuinely mounted — silently dropping every
    // setState call below for the rest of this component's real lifetime.
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Study goals from Settings → Study Preferences (in hours).
  const [dailyGoalHours, setDailyGoalHours] = useState(4);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(28);

  useEffect(() => {
    let cancelled = false;
    settingsService
      .getSettings()
      .then((settings) => {
        if (cancelled) return;
        setDailyGoalHours(settings.study_preferences.dailyGoalHours);
        setWeeklyGoalHours(settings.study_preferences.weeklyGoalHours);
      })
      .catch(() => {
        // Not fatal — planner still works with defaults.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load exam date from localStorage once on mount.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(EXAM_DATE_KEY) : null;
    if (saved) setExamDate(saved);
  }, []);

  function saveExamDate(value: string) {
    setExamDate(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(EXAM_DATE_KEY, value);
    }
  }

  const countdownDays = useMemo(() => {
    if (!examDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(examDate);
    const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    return diff;
  }, [examDate]);

  const range = useMemo(() => {
    if (view === "daily") {
      const s = toDateStr(dailyDate);
      return { start: s, end: s };
    }
    if (view === "weekly") {
      const start = startOfWeek(weekAnchor);
      const end = addDays(start, 6);
      return { start: toDateStr(start), end: toDateStr(end) };
    }
    const start = startOfMonth(monthAnchor);
    const end = endOfMonth(monthAnchor);
    return { start: toDateStr(start), end: toDateStr(end) };
  }, [view, dailyDate, weekAnchor, monthAnchor]);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const data = await plannerService.getTasksInRange(range.start, range.end);
      if (!isMountedRef.current) return;
      setTasks(data);
    } catch (err: unknown) {
      if (isMountedRef.current) setError(getErrorMessage(err, "Could not load tasks."));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }

  const [rescheduleChecked, setRescheduleChecked] = useState(false);

  // Auto-reschedule missed tasks once on mount. The range-effect below waits
  // for this to finish (rescheduleChecked) before its first fetch, so a task
  // that just got moved to "today" is guaranteed to be in the first load
  // instead of possibly being missed by a fetch that raced ahead of this.
  useEffect(() => {
    (async () => {
      try {
        const count = await plannerService.rescheduleMissedTasks();
        if (isMountedRef.current) setRescheduledCount(count);
      } catch {
        // Silently ignore — task list will still load below.
      } finally {
        if (isMountedRef.current) setRescheduleChecked(true);
      }
    })();
  }, []);

  // Loads tasks for the current range. Only fires once the initial
  // reschedule check has settled (see effect above) — previously this ran
  // independently on mount too, causing every page load to fire two
  // getTasksInRange() calls instead of one.
  useEffect(() => {
    if (!rescheduleChecked) return;
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rescheduleChecked, range.start, range.end]);

  async function handleAddTask() {
    if (isAddingTask) return; // Ignore repeat clicks while a request is already in flight

    if (!newTitle.trim()) {
      setError("Please enter a task title.");
      return;
    }

    if (!Number.isFinite(newDuration) || newDuration <= 0) {
      setError("Please enter a valid duration greater than 0 minutes.");
      return;
    }

    const taskDate = view === "daily" ? toDateStr(dailyDate) : toDateStr(new Date());

    try {
      setIsAddingTask(true);
      await plannerService.createTask({
        title: newTitle.trim(),
        duration: newDuration,
        subject: newExam,
        task_date: taskDate,
      });
      setNewTitle("");
      loadTasks();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not add task."));
    } finally {
      setIsAddingTask(false);
    }
  }

  async function handleToggle(task: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    try {
      await plannerService.toggleDone(task.id, !task.done);
    } catch {
      loadTasks();
    }
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await plannerService.deleteTask(id);
    } catch {
      loadTasks();
    }
  }

  const cardStyle: React.CSSProperties = {
    background: themeStyles.cardBg,
    border: themeStyles.cardBorder,
    borderRadius: "16px",
    transition: "background 0.3s, border 0.3s",
    boxSizing: "border-box",
  };

  const inputStyle: React.CSSProperties = {
    background: themeStyles.inputBg,
    border: themeStyles.inputBorder,
    borderRadius: "10px",
    padding: "11px 14px",
    color: themeStyles.inputColor,
    fontSize: ".88rem",
    outline: "none",
    transition: "background 0.3s, color 0.3s, border 0.3s",
    boxSizing: "border-box",
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 18px",
    borderRadius: "10px",
    border: active ? "1px solid transparent" : `1px solid ${themeStyles.tabBorder}`,
    background: active ? G.grad : "transparent",
    color: active ? "var(--theme-accent-text)" : themeStyles.subText,
    fontWeight: 700,
    fontSize: ".85rem",
    cursor: "pointer",
    flex: "1 1 auto",
  });

  function renderTaskRow(task: Task) {
    return (
      <div
        key={task.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 14px",
          borderRadius: "10px",
          border: themeStyles.cardBorder,
          background: themeStyles.cardBg,
          marginBottom: "8px",
          transition: "background 0.3s, border 0.3s",
          boxSizing: "border-box",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => handleToggle(task)}
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            border: task.done ? "none" : `1px solid ${themeStyles.checkboxBorder}`,
            background: task.done ? G.grad : "transparent",
            color: "var(--theme-accent-text)",
            cursor: "pointer",
            fontSize: ".75rem",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {task.done ? "✓" : ""}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: ".9rem",
              fontWeight: 600,
              textDecoration: task.done ? "line-through" : "none",
              color: task.done ? themeStyles.subText : themeStyles.color,
              wordBreak: "break-word",
            }}
          >
            {task.title}
          </p>
          <div style={{ display: "flex", gap: "10px", color: themeStyles.subText, fontSize: ".75rem", marginTop: "2px", flexWrap: "wrap" }}>
            <span>{task.duration} min</span>
            <span>•</span>
            <span>{task.subject?.toUpperCase()}</span>
            <span>•</span>
            <span>{task.task_date}</span>
          </div>
        </div>

        <button
          onClick={() => handleDelete(task.id)}
          style={{
            background: "transparent",
            border: "none",
            color: "#EF4444",
            cursor: "pointer",
            fontSize: ".78rem",
            flexShrink: 0,
          }}
        >
          Delete
        </button>
      </div>
    );
  }

  const doneCount = tasks.filter((t) => t.done).length;

  const plannedMinutes = tasks.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  const goalMinutes = view === "daily" ? dailyGoalHours * 60 : view === "weekly" ? weeklyGoalHours * 60 : 0;
  const goalPercent = goalMinutes > 0 ? Math.min(Math.round((plannedMinutes / goalMinutes) * 100), 100) : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeStyles.bg,
        color: themeStyles.color,
        fontFamily: "'DM Sans',sans-serif",
        padding: "clamp(16px, 4vw, 32px)",
        transition: "background 0.3s, color 0.3s",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "20px" }}>
          <BackToDashboardLink />
          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 800, marginBottom: "8px", color: themeStyles.color }}>
            Study <span style={G.gradText}>Planner</span>
          </h1>
          <p style={{ color: themeStyles.subText, fontSize: ".95rem" }}>
            Plan your daily, weekly, and monthly study goals.
          </p>
        </header>

        {rescheduledCount > 0 && (
          <div
            style={{
              ...cardStyle,
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: ".82rem",
              color: "var(--theme-accent)",
            }}
          >
            {rescheduledCount} missed task{rescheduledCount > 1 ? "s" : ""} auto-rescheduled to today.
          </div>
        )}

        {/* Exam countdown */}
        <div
          style={{
            ...cardStyle,
            padding: "18px 20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <p style={{ color: themeStyles.subText, fontSize: ".78rem", fontWeight: 600, textTransform: "uppercase" }}>
              Exam Countdown
            </p>
            {countdownDays !== null ? (
              <p style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: themeStyles.color }}>
                {countdownDays >= 0 ? (
                  <span style={G.gradText}>{countdownDays} days left</span>
                ) : (
                  <span style={{ color: "#EF4444" }}>Exam date has passed</span>
                )}
              </p>
            ) : (
              <p style={{ color: themeStyles.subText, fontSize: ".85rem", marginTop: "4px" }}>
                Set your exam date to see the countdown.
              </p>
            )}
          </div>
          <input
            type="date"
            value={examDate}
            onChange={(e) => saveExamDate(e.target.value)}
            style={{ ...inputStyle, width: "auto" }}
          />
        </div>

        {/* View tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
          <button style={tabBtn(view === "daily")} onClick={() => setView("daily")}>
            Daily
          </button>
          <button style={tabBtn(view === "weekly")} onClick={() => setView("weekly")}>
            Weekly
          </button>
          <button style={tabBtn(view === "monthly")} onClick={() => setView("monthly")}>
            Monthly
          </button>
        </div>

        {/* Date navigation for daily/weekly/monthly */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {view === "daily" && (
            <>
              <button style={tabBtn(false)} onClick={() => setDailyDate((d) => addDays(d, -1))}>
                ← Prev
              </button>
              <span style={{ fontWeight: 700, color: themeStyles.color }}>{toDateStr(dailyDate)}</span>
              <button style={tabBtn(false)} onClick={() => setDailyDate((d) => addDays(d, 1))}>
                Next →
              </button>
            </>
          )}
          {view === "weekly" && (
            <>
              <button style={tabBtn(false)} onClick={() => setWeekAnchor((d) => addDays(d, -7))}>
                ← Prev Week
              </button>
              <span style={{ fontWeight: 700, color: themeStyles.color, textAlign: "center" }}>
                {toDateStr(startOfWeek(weekAnchor))} to {toDateStr(addDays(startOfWeek(weekAnchor), 6))}
              </span>
              <button style={tabBtn(false)} onClick={() => setWeekAnchor((d) => addDays(d, 7))}>
                Next Week →
              </button>
            </>
          )}
          {view === "monthly" && (
            <>
              <button style={tabBtn(false)} onClick={() => setMonthAnchor((d) => addMonths(d, -1))}>
                ← Prev Month
              </button>
              <span style={{ fontWeight: 700, color: themeStyles.color }}>
                {monthAnchor.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button style={tabBtn(false)} onClick={() => setMonthAnchor((d) => addMonths(d, 1))}>
                Next Month →
              </button>
            </>
          )}
        </div>

        {/* Summary */}
        <div style={{ ...cardStyle, padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", color: themeStyles.subText, flexWrap: "wrap", gap: "8px" }}>
            <span style={{ color: themeStyles.color }}>Total: {tasks.length}</span>
            <span style={{ color: "#22C55E" }}>Done: {doneCount}</span>
            <span style={{ color: "var(--theme-accent)" }}>Pending: {tasks.length - doneCount}</span>
          </div>

          {goalMinutes > 0 && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".76rem", color: themeStyles.subText, marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                <span>
                  {view === "daily" ? "Today's" : "This week's"} planned time vs. your{" "}
                  {view === "daily" ? "daily" : "weekly"} goal ({view === "daily" ? dailyGoalHours : weeklyGoalHours}h)
                </span>
                <span>
                  {Math.round(plannedMinutes / 60)}h / {view === "daily" ? dailyGoalHours : weeklyGoalHours}h
                </span>
              </div>
              <div style={{ height: "6px", background: themeStyles.progressBarBg, borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${goalPercent}%`, height: "100%", background: G.grad }} />
              </div>
              <a href="/settings" style={{ color: themeStyles.subText, fontSize: ".7rem", textDecoration: "none", display: "inline-block", marginTop: "6px" }}>
                Change your goal in Settings →
              </a>
            </div>
          )}
        </div>

        {/* Add task */}
        <div style={{ ...cardStyle, padding: "18px", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title (e.g. Revise Polity Ch. 4)"
              style={{ ...inputStyle, flex: "2 1 200px" }}
            />
            <select value={newExam} onChange={(e) => setNewExam(e.target.value)} style={{ ...inputStyle, flex: "1 1 120px" }}>
              {EXAMS.map((e) => (
                <option key={e.value} value={e.value} style={{ background: themeStyles.inputBg, color: themeStyles.inputColor }}>
                  {e.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={5}
              step={5}
              value={newDuration}
              onChange={(e) => setNewDuration(Math.max(0, Number(e.target.value)))}
              style={{ ...inputStyle, flex: "0 1 90px" }}
            />
          </div>
          <button
            onClick={handleAddTask}
            disabled={isAddingTask}
            style={{
              width: "100%",
              background: G.grad,
              border: "none",
              color: "var(--theme-accent-text)",
              padding: "11px",
              borderRadius: "10px",
              cursor: isAddingTask ? "not-allowed" : "pointer",
              opacity: isAddingTask ? 0.7 : 1,
              fontWeight: 700,
              fontSize: ".9rem",
            }}
          >
            {isAddingTask
              ? "Adding..."
              : `Add Task ${view === "daily" ? `for ${toDateStr(dailyDate)}` : "for Today"}`}
          </button>
        </div>

        {error && (
          <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "14px" }}>{error}</p>
        )}

        {/* Task list */}
        {loading ? (
          <p style={{ color: themeStyles.subText, fontSize: ".85rem" }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div style={{ ...cardStyle, padding: "30px", textAlign: "center", color: themeStyles.subText }}>
            No tasks in this range yet. Add one above.
          </div>
        ) : view === "weekly" ? (
          Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(weekAnchor), i)).map((day) => {
            const dayStr = toDateStr(day);
            const dayTasks = tasks.filter((t) => t.task_date === dayStr);
            if (dayTasks.length === 0) return null;
            return (
              <div key={dayStr} style={{ marginBottom: "16px" }}>
                <p style={{ fontWeight: 700, marginBottom: "8px", color: "var(--theme-accent)" }}>
                  {day.toLocaleDateString("en-US", { weekday: "long" })} — {dayStr}
                </p>
                {dayTasks.map(renderTaskRow)}
              </div>
            );
          })
        ) : (
          tasks.map(renderTaskRow)
        )}
      </div>
    </div>
  );
}