"use client";

import { useEffect, useMemo, useState } from "react";
import { plannerService, Task } from "@/services/plannerService";
import { settingsService } from "@/services/settingsService";

const G = {
  grad: "linear-gradient(135deg,#F59E0B,#FBBF24)",
  gradText: {
    background: "linear-gradient(135deg,#F59E0B,#FBBF24)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  card: {
    background: "#0B1220",
    border: "1px solid rgba(255,255,255,.06)",
    borderRadius: "16px",
  },
};

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
  const [rescheduledCount, setRescheduledCount] = useState(0);

  // Study goals from Settings → Study Preferences (in hours). Used to show
  // "how much of today's/this week's goal is planned" progress bars below.
  const [dailyGoalHours, setDailyGoalHours] = useState(4);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(28);

  useEffect(() => {
    settingsService
      .getSettings()
      .then((settings) => {
        setDailyGoalHours(settings.study_preferences.dailyGoalHours);
        setWeeklyGoalHours(settings.study_preferences.weeklyGoalHours);
      })
      .catch(() => {
        // Not fatal — the planner still works with the default goal values above.
      });
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
      setTasks(data);
    } catch (err: any) {
      setError(err.message ?? "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-reschedule missed tasks once on mount, then load tasks for current range.
  useEffect(() => {
    (async () => {
      try {
        const count = await plannerService.rescheduleMissedTasks();
        setRescheduledCount(count);
      } catch {
        // Silently ignore — task list will still load below.
      }
      loadTasks();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start, range.end]);

  async function handleAddTask() {
    if (!newTitle.trim()) {
      setError("Please enter a task title.");
      return;
    }

    const taskDate = view === "daily" ? toDateStr(dailyDate) : toDateStr(new Date());

    try {
      await plannerService.createTask({
        title: newTitle.trim(),
        duration: newDuration,
        subject: newExam,
        task_date: taskDate,
      });
      setNewTitle("");
      loadTasks();
    } catch (err: any) {
      setError(err.message ?? "Could not add task.");
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

  const inputStyle: React.CSSProperties = {
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "10px",
    padding: "10px 12px",
    color: "white",
    fontSize: ".88rem",
    outline: "none",
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 18px",
    borderRadius: "10px",
    border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,.1)",
    background: active ? G.grad : "transparent",
    color: active ? "#111827" : "#94A3B8",
    fontWeight: 700,
    fontSize: ".85rem",
    cursor: "pointer",
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
          border: "1px solid rgba(255,255,255,.06)",
          marginBottom: "8px",
        }}
      >
        <button
          onClick={() => handleToggle(task)}
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            border: task.done ? "none" : "1px solid rgba(255,255,255,.2)",
            background: task.done ? G.grad : "transparent",
            color: "#111827",
            cursor: "pointer",
            fontSize: ".75rem",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {task.done ? "✓" : ""}
        </button>

        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: ".9rem",
              fontWeight: 600,
              textDecoration: task.done ? "line-through" : "none",
              color: task.done ? "#64748B" : "white",
            }}
          >
            {task.title}
          </p>
          <div style={{ display: "flex", gap: "10px", color: "#64748B", fontSize: ".75rem", marginTop: "2px" }}>
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
          }}
        >
          Delete
        </button>
      </div>
    );
  }

  const doneCount = tasks.filter((t) => t.done).length;

  // Compares planned task time against the Study Preferences goal — only
  // meaningful for daily/weekly views (monthly has no single goal to compare against).
  const plannedMinutes = tasks.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  const goalMinutes = view === "daily" ? dailyGoalHours * 60 : view === "weekly" ? weeklyGoalHours * 60 : 0;
  const goalPercent = goalMinutes > 0 ? Math.min(Math.round((plannedMinutes / goalMinutes) * 100), 100) : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080C14",
        color: "white",
        fontFamily: "'DM Sans',sans-serif",
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            Study <span style={G.gradText}>Planner</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Plan your daily, weekly, and monthly study goals.
          </p>
        </header>

        {rescheduledCount > 0 && (
          <div
            style={{
              ...G.card,
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: ".82rem",
              color: "#F59E0B",
            }}
          >
            {rescheduledCount} missed task{rescheduledCount > 1 ? "s" : ""} auto-rescheduled to today.
          </div>
        )}

        {/* Exam countdown */}
        <div
          style={{
            ...G.card,
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
            <p style={{ color: "#94A3B8", fontSize: ".78rem", fontWeight: 600, textTransform: "uppercase" }}>
              Exam Countdown
            </p>
            {countdownDays !== null ? (
              <p style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px" }}>
                {countdownDays >= 0 ? (
                  <span style={G.gradText}>{countdownDays} days left</span>
                ) : (
                  <span style={{ color: "#EF4444" }}>Exam date has passed</span>
                )}
              </p>
            ) : (
              <p style={{ color: "#64748B", fontSize: ".85rem", marginTop: "4px" }}>
                Set your exam date to see the countdown.
              </p>
            )}
          </div>
          <input
            type="date"
            value={examDate}
            onChange={(e) => saveExamDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* View tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
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
          }}
        >
          {view === "daily" && (
            <>
              <button style={tabBtn(false)} onClick={() => setDailyDate((d) => addDays(d, -1))}>
                ← Prev
              </button>
              <span style={{ fontWeight: 700 }}>{toDateStr(dailyDate)}</span>
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
              <span style={{ fontWeight: 700 }}>
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
              <span style={{ fontWeight: 700 }}>
                {monthAnchor.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button style={tabBtn(false)} onClick={() => setMonthAnchor((d) => addMonths(d, 1))}>
                Next Month →
              </button>
            </>
          )}
        </div>

        {/* Summary */}
        <div style={{ ...G.card, padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", color: "#94A3B8" }}>
            <span>Total: {tasks.length}</span>
            <span style={{ color: "#22C55E" }}>Done: {doneCount}</span>
            <span style={{ color: "#F59E0B" }}>Pending: {tasks.length - doneCount}</span>
          </div>

          {goalMinutes > 0 && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".76rem", color: "#64748B", marginBottom: "6px" }}>
                <span>
                  {view === "daily" ? "Today's" : "This week's"} planned time vs. your{" "}
                  {view === "daily" ? "daily" : "weekly"} goal ({view === "daily" ? dailyGoalHours : weeklyGoalHours}h)
                </span>
                <span>
                  {Math.round(plannedMinutes / 60)}h / {view === "daily" ? dailyGoalHours : weeklyGoalHours}h
                </span>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,.06)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${goalPercent}%`, height: "100%", background: G.grad }} />
              </div>
              <a href="/settings" style={{ color: "#475569", fontSize: ".7rem", textDecoration: "none" }}>
                Change your goal in Settings →
              </a>
            </div>
          )}
        </div>

        {/* Add task */}
        <div style={{ ...G.card, padding: "18px", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title (e.g. Revise Polity Ch. 4)"
              style={{ ...inputStyle, flex: 2, minWidth: "200px" }}
            />
            <select value={newExam} onChange={(e) => setNewExam(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {EXAMS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={5}
              step={5}
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value))}
              style={{ ...inputStyle, width: "90px" }}
            />
          </div>
          <button
            onClick={handleAddTask}
            style={{
              width: "100%",
              background: G.grad,
              border: "none",
              color: "#111827",
              padding: "11px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: ".9rem",
            }}
          >
            Add Task {view === "daily" ? `for ${toDateStr(dailyDate)}` : "for Today"}
          </button>
        </div>

        {error && (
          <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "14px" }}>{error}</p>
        )}

        {/* Task list */}
        {loading ? (
          <p style={{ color: "#64748B", fontSize: ".85rem" }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div style={{ ...G.card, padding: "30px", textAlign: "center", color: "#64748B" }}>
            No tasks in this range yet. Add one above.
          </div>
        ) : view === "weekly" ? (
          Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(weekAnchor), i)).map((day) => {
            const dayStr = toDateStr(day);
            const dayTasks = tasks.filter((t) => t.task_date === dayStr);
            if (dayTasks.length === 0) return null;
            return (
              <div key={dayStr} style={{ marginBottom: "16px" }}>
                <p style={{ fontWeight: 700, marginBottom: "8px", color: "#F59E0B" }}>
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