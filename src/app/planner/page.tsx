"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const G = {
  grad: "linear-gradient(120deg,#F59E0B,#F97316)",
  card: { background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px" },
};

// ══════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════
type Task = {
  id: string;
  title: string;
  subject: string;
  duration: number; // minutes
  done: boolean;
  date: string; // YYYY-MM-DD
};

type PomodoroMode = "focus" | "short" | "long";

const POMODORO_TIMES: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long:  15 * 60,
};

const SUBJECTS = ["UPSC", "JEE", "NEET", "SSC", "Maths", "Physics", "Chemistry", "Biology", "History", "Geography", "Economy", "Polity", "Other"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - day + i);
    return d.toISOString().split("T")[0];
  });
}

// localStorage helpers
const TASKS_KEY = "mentora_planner_tasks";
function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]"); } catch { return []; }
}
function saveTasks(tasks: Task[]) {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch { /* ignore */ }
}

export default function StudyPlanner() {
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTitle, setNewTitle]       = useState("");
  const [newSubject, setNewSubject]   = useState("UPSC");
  const [newDuration, setNewDuration] = useState(30);
  const [newDate, setNewDate]         = useState(todayStr());
  const [selectedDate, setSelectedDate] = useState(todayStr());

  // Pomodoro
  const [pomMode, setPomMode]     = useState<PomodoroMode>("focus");
  const [pomTime, setPomTime]     = useState(POMODORO_TIMES.focus);
  const [pomRunning, setPomRunning] = useState(false);
  const [pomSessions, setPomSessions] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage
  useEffect(() => { setTasks(loadTasks()); }, []);

  // Pomodoro timer
  useEffect(() => {
    if (pomRunning) {
      timerRef.current = setInterval(() => {
        setPomTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setPomRunning(false);
            if (pomMode === "focus") setPomSessions(s => s + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pomRunning, pomMode]);

  const switchMode = (mode: PomodoroMode) => {
    setPomMode(mode);
    setPomTime(POMODORO_TIMES[mode]);
    setPomRunning(false);
  };

  const resetTimer = () => {
    setPomTime(POMODORO_TIMES[pomMode]);
    setPomRunning(false);
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const pomPct = ((POMODORO_TIMES[pomMode] - pomTime) / POMODORO_TIMES[pomMode]) * 100;

  // Tasks
  const addTask = () => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      subject: newSubject,
      duration: newDuration,
      done: false,
      date: newDate,
    };
    const updated = [...tasks, task];
    setTasks(updated);
    saveTasks(updated);
    setNewTitle("");
    setShowAddTask(false);
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  };

  const weekDates = getWeekDates();
  const todayTasks = tasks.filter(t => t.date === selectedDate);
  const doneTasks  = todayTasks.filter(t => t.done).length;
  const totalMins  = todayTasks.reduce((s, t) => s + t.duration, 0);
  const doneMins   = todayTasks.filter(t => t.done).reduce((s, t) => s + t.duration, 0);

  // Weekly stats
  const weeklyData = weekDates.map(date => ({
    date,
    total: tasks.filter(t => t.date === date).length,
    done:  tasks.filter(t => t.date === date && t.done).length,
  }));

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "#0D1220",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
    color: "white", fontSize: "0.875rem", outline: "none",
    fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "white", fontFamily: "'DM Sans',sans-serif" }}>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,12,20,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>⚡</div>
              <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "white" }}>Mentor<span style={{ color: "#F59E0B" }}>a</span></span>
            </a>
            <a href="/dashboard" style={{ fontSize: "0.85rem", color: "#64748B", textDecoration: "none" }}>← Dashboard</a>
          </div>
          <button onClick={() => setShowAddTask(true)} style={{ padding: "9px 20px", borderRadius: "10px", background: G.grad, border: "none", color: "#080C14", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
            + Add Task
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 32px 60px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "6px" }}>Study Planner</h1>
          <p style={{ color: "#64748B", fontSize: "0.9rem" }}>Plan your day, track progress, and stay focused with Pomodoro.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>

          {/* LEFT — Tasks + Week */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Week strip */}
            <div style={{ ...G.card, padding: "20px" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px" }}>This Week</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "8px" }}>
                {weekDates.map((date, i) => {
                  const isToday    = date === todayStr();
                  const isSelected = date === selectedDate;
                  const wd = weeklyData[i];
                  const pct = wd.total > 0 ? Math.round((wd.done / wd.total) * 100) : 0;
                  return (
                    <div key={date} onClick={() => setSelectedDate(date)} style={{
                      textAlign: "center", padding: "12px 6px", borderRadius: "12px", cursor: "pointer",
                      border: isSelected ? "1.5px solid #F59E0B" : "1px solid rgba(255,255,255,0.07)",
                      background: isSelected ? "rgba(245,158,11,0.08)" : isToday ? "rgba(255,255,255,0.03)" : "transparent",
                      transition: "all 0.18s",
                    }}>
                      <p style={{ fontSize: "0.65rem", color: isToday ? "#F59E0B" : "#64748B", fontWeight: 600, marginBottom: "6px" }}>{DAYS[i]}</p>
                      <p style={{ fontSize: "0.95rem", fontWeight: 700, color: isSelected ? "#F59E0B" : isToday ? "white" : "#94A3B8" }}>
                        {new Date(date + "T12:00:00").getDate()}
                      </p>
                      {wd.total > 0 && (
                        <div style={{ marginTop: "6px" }}>
                          <div style={{ height: "3px", background: "#1A2640", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: G.grad }} />
                          </div>
                          <p style={{ fontSize: "0.6rem", color: "#64748B", marginTop: "3px" }}>{wd.done}/{wd.total}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
              {[
                { icon: "📋", val: `${doneTasks}/${todayTasks.length}`, lbl: "Tasks Done", color: "#22C55E" },
                { icon: "⏱️", val: `${doneMins}m`, lbl: "Study Time", color: "#F59E0B" },
                { icon: "🎯", val: todayTasks.length > 0 ? `${Math.round((doneTasks/todayTasks.length)*100)}%` : "0%", lbl: "Completion", color: "#818CF8" },
              ].map(s => (
                <div key={s.lbl} style={{ ...G.card, padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: "1.4rem", marginBottom: "4px" }}>{s.icon}</p>
                  <p style={{ fontSize: "1.3rem", fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{s.val}</p>
                  <p style={{ fontSize: "0.72rem", color: "#64748B" }}>{s.lbl}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {todayTasks.length > 0 && (
              <div style={{ ...G.card, padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748B", marginBottom: "8px" }}>
                  <span>Daily Goal Progress</span>
                  <span style={{ color: "#F59E0B", fontFamily: "monospace", fontWeight: 600 }}>{doneMins}/{totalMins} min</span>
                </div>
                <div style={{ height: "8px", background: "#1A2640", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${totalMins > 0 ? (doneMins/totalMins)*100 : 0}%`, background: G.grad, borderRadius: "4px", transition: "width 0.4s ease" }} />
                </div>
              </div>
            )}

            {/* Task list */}
            <div style={{ ...G.card, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  Tasks for {selectedDate === todayStr() ? "Today" : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </h2>
                <button onClick={() => setShowAddTask(true)} style={{ fontSize: "0.78rem", color: "#F59E0B", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>+ Add</button>
              </div>

              {todayTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <p style={{ fontSize: "2rem", marginBottom: "10px" }}>📝</p>
                  <p style={{ color: "#64748B", fontSize: "0.875rem", marginBottom: "14px" }}>No tasks for this day yet.</p>
                  <button onClick={() => setShowAddTask(true)} style={{ padding: "9px 20px", borderRadius: "10px", background: G.grad, border: "none", color: "#080C14", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                    Add First Task
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {todayTasks.map(task => (
                    <div key={task.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "#0D1220", border: `1px solid ${task.done ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", opacity: task.done ? 0.65 : 1, transition: "all 0.2s" }}>
                      <div onClick={() => toggleTask(task.id)} style={{ width: "22px", height: "22px", borderRadius: "50%", border: task.done ? "none" : "1.5px solid rgba(255,255,255,0.2)", background: task.done ? G.grad : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "white", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
                        {task.done ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.88rem", fontWeight: 600, color: task.done ? "#64748B" : "#CBD5E1", textDecoration: task.done ? "line-through" : "none", marginBottom: "3px" }}>{task.title}</p>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ fontSize: "0.68rem", color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "100px", padding: "1px 7px" }}>{task.subject}</span>
                          <span style={{ fontSize: "0.68rem", color: "#64748B", fontFamily: "monospace" }}>⏱ {task.duration}m</span>
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: "0.9rem", flexShrink: 0, padding: "4px", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EF4444"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#334155"}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Pomodoro */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div style={{ ...G.card, padding: "28px", textAlign: "center" }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "20px" }}>🍅 Pomodoro Timer</h2>

              {/* Mode tabs */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "28px", justifyContent: "center" }}>
                {(["focus", "short", "long"] as PomodoroMode[]).map(m => (
                  <button key={m} onClick={() => switchMode(m)} style={{
                    padding: "7px 14px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    border: "none",
                    background: pomMode === m ? G.grad : "#1A2640",
                    color: pomMode === m ? "#080C14" : "#64748B",
                    transition: "all 0.2s",
                  }}>{m === "focus" ? "Focus" : m === "short" ? "Short Break" : "Long Break"}</button>
                ))}
              </div>

              {/* Circle timer */}
              <div style={{ position: "relative", width: "180px", height: "180px", margin: "0 auto 24px" }}>
                <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="90" cy="90" r="80" fill="none" stroke="#1A2640" strokeWidth="10" />
                  <circle cx="90" cy="90" r="80" fill="none"
                    stroke="url(#timerGrad)" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - pomPct / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                  <defs>
                    <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#F97316" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "2.4rem", fontWeight: 900, fontFamily: "monospace", color: pomTime === 0 ? "#22C55E" : "white", letterSpacing: "-0.02em" }}>{fmtTime(pomTime)}</span>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "2px" }}>{pomMode === "focus" ? "Focus Time" : pomMode === "short" ? "Short Break" : "Long Break"}</span>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
                <button onClick={resetTimer} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94A3B8", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>↺ Reset</button>
                <button onClick={() => setPomRunning(r => !r)} style={{ padding: "10px 28px", borderRadius: "10px", border: "none", background: pomRunning ? "#EF4444" : G.grad, color: pomRunning ? "white" : "#080C14", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", minWidth: "100px" }}>
                  {pomTime === 0 ? "✓ Done!" : pomRunning ? "⏸ Pause" : "▶ Start"}
                </button>
              </div>

              {/* Sessions */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
                <p style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "10px" }}>Sessions completed today</p>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                  {Array.from({ length: Math.max(4, pomSessions + 1) }, (_, i) => (
                    <div key={i} style={{ width: "28px", height: "28px", borderRadius: "50%", background: i < pomSessions ? G.grad : "#1A2640", border: i < pomSessions ? "none" : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>
                      {i < pomSessions ? "🍅" : ""}
                    </div>
                  ))}
                </div>
                {pomSessions > 0 && (
                  <p style={{ fontSize: "0.75rem", color: "#F59E0B", marginTop: "10px", fontWeight: 600 }}>
                    {pomSessions * 25} minutes focused today! 🔥
                  </p>
                )}
              </div>
            </div>

            {/* Tips card */}
            <div style={{ ...G.card, padding: "20px" }}>
              <h3 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "14px" }}>💡 Pomodoro Tips</h3>
              {[
                "Focus for 25 min, then take a 5 min break",
                "After 4 sessions, take a 15-30 min long break",
                "Remove all distractions during focus time",
                "Use breaks to stretch and refresh your mind",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ color: "#F59E0B", fontSize: "0.7rem", marginTop: "3px", flexShrink: 0 }}>✦</span>
                  <p style={{ fontSize: "0.8rem", color: "#64748B", lineHeight: 1.5 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
          <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "32px", maxWidth: "440px", width: "100%" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px" }}>Add New Task</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>Task Title</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Read Laxmikanth Chapter 5" style={inputStyle}
                  onKeyDown={e => e.key === "Enter" && addTask()} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>Subject</label>
                  <select value={newSubject} onChange={e => setNewSubject(e.target.value)} style={{ ...inputStyle }}>
                    {SUBJECTS.map(s => <option key={s} value={s} style={{ background: "#111827" }}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>Duration (min)</label>
                  <input type="number" value={newDuration} onChange={e => setNewDuration(parseInt(e.target.value) || 30)} min={5} max={240} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>Date</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button onClick={() => setShowAddTask(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#CBD5E1", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>Cancel</button>
              <button onClick={addTask} disabled={!newTitle.trim()} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: newTitle.trim() ? G.grad : "#1A2640", color: newTitle.trim() ? "#080C14" : "#334155", fontWeight: 700, fontSize: "0.85rem", cursor: newTitle.trim() ? "pointer" : "not-allowed" }}>Add Task</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:1024px){div[style*="1fr 360px"]{grid-template-columns:1fr!important}}
        @media(max-width:600px){div[style*="padding: 32px 32px"]{padding:20px 16px!important}div[style*="repeat(7,1fr)"]{gap:4px!important}}
      `}</style>
    </div>
  );
}