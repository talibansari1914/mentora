"use client";

import { useEffect, useMemo, useState } from "react";
import { testService } from "@/services/testService";
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

const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  upsc: ["Polity", "History", "Geography", "Economy", "Environment", "CSAT"],
  jee: ["Physics", "Chemistry", "Maths"],
  neet: ["Biology", "Physics", "Chemistry"],
  ssc: ["Reasoning", "Quant", "English", "GK"],
};

const COUNT_OPTIONS = [5, 10, 15, 20, 25];

interface PracticeQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  topic: string;
  explanation: string;
}

type Stage = "setup" | "quiz" | "result";

function improvementMessage(accuracy: number) {
  if (accuracy >= 85) {
    return "Excellent! You're ready on this subject — just keep up regular revision.";
  }
  if (accuracy >= 70) {
    return "You're doing well. A bit more practice will make this subject solid.";
  }
  if (accuracy >= 50) {
    return "Your basics are clear but you need more practice — try at least 20 questions in this subject daily.";
  }
  return "The weak topics in this subject need to be studied again — use Notes Generator to clear the concepts first, then come back to practice.";
}

export default function DailyPracticePage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [exam, setExam] = useState("upsc");
  const [subject, setSubject] = useState(SUBJECTS_BY_EXAM["upsc"][0]);
  const [count, setCount] = useState(5);

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Learning Preferences from Settings — configured centrally so Daily
  // Practice behaves consistently with what the student set up there.
  const [difficulty, setDifficulty] = useState("Medium");
  const [adaptiveLearning, setAdaptiveLearning] = useState(false);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  useEffect(() => {
    settingsService
      .getSettings()
      .then((settings) => {
        setDifficulty(settings.learning_preferences.difficultyLevel);
        setAdaptiveLearning(settings.learning_preferences.adaptiveLearning);
      })
      .catch(() => {
        // Not fatal — practice still works with the defaults above.
      });
  }, []);

  // When Adaptive Learning is on, pull the student's weak subjects so the
  // question generator can lean extra questions toward them.
  useEffect(() => {
    if (!adaptiveLearning) {
      setWeakTopics([]);
      return;
    }
    testService
      .getWeakSubjects(exam, 5)
      .then((subjects) => setWeakTopics(subjects.map((s) => s.subject)))
      .catch(() => setWeakTopics([]));
  }, [adaptiveLearning, exam]);

  const subjectOptions = useMemo(() => SUBJECTS_BY_EXAM[exam] ?? [], [exam]);

  function handleExamChange(value: string) {
    setExam(value);
    setSubject(SUBJECTS_BY_EXAM[value]?.[0] ?? "");
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam,
          subject,
          count,
          difficulty,
          emphasizeTopics: weakTopics.length > 0 ? weakTopics.join(", ") : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate questions.");
      }

      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(-1));
      setStage("quiz");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  }

  const scoring = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const topicWrongCount: Record<string, number> = {};

    questions.forEach((q, i) => {
      const given = answers[i];
      if (given === -1) {
        skipped += 1;
        return;
      }
      if (given === q.correctIndex) {
        correct += 1;
      } else {
        wrong += 1;
        topicWrongCount[q.topic] = (topicWrongCount[q.topic] ?? 0) + 1;
      }
    });

    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const weakTopics = Object.entries(topicWrongCount)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count }));

    return { correct, wrong, skipped, total, accuracy, weakTopics };
  }, [questions, answers]);

  async function handleSubmit() {
    setStage("result");
    setSaveError(null);

    try {
      await testService.saveResult({
        test_id: `practice-${Date.now()}`,
        title: `Daily Practice - ${subject}`,
        exam,
        score: scoring.correct,
        total: scoring.total,
        correct: scoring.correct,
        wrong: scoring.wrong,
        skipped: scoring.skipped,
        accuracy: scoring.accuracy,
        time_used: 0,
        subject_breakdown: {
          [subject]: {
            correct: scoring.correct,
            wrong: scoring.wrong,
            skipped: scoring.skipped,
            total: scoring.total,
            accuracy: scoring.accuracy,
          },
        },
      });
    } catch (err: any) {
      setSaveError(
        "Could not save your result (please check you're logged in). Your score is shown below."
      );
    }
  }

  function handleRestart() {
    setStage("setup");
    setQuestions([]);
    setAnswers([]);
    setError(null);
    setSaveError(null);
  }

  const selectStyle: React.CSSProperties = {
    width: "100%",
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "white",
    fontSize: ".9rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#94A3B8",
    fontSize: ".78rem",
    fontWeight: 600,
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: ".03em",
  };

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
        <header style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            Daily <span style={G.gradText}>Practice</span>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: ".95rem" }}>
            Choose an exam and subject, and practice new questions every day.
          </p>
          <p style={{ color: "#475569", fontSize: ".78rem", marginTop: "8px" }}>
            Difficulty: <strong style={{ color: "#94A3B8" }}>{difficulty}</strong>
            {adaptiveLearning && weakTopics.length > 0 && (
              <> · Adaptive Learning is <strong style={{ color: "#22C55E" }}>ON</strong> (leaning into: {weakTopics.join(", ")})</>
            )}
            {" · "}
            <a href="/settings" style={{ color: "#F59E0B", textDecoration: "none" }}>
              Change in Settings
            </a>
          </p>
        </header>

        {stage === "setup" && (
          <div style={{ ...G.card, padding: "22px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                gap: "14px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Exam</label>
                <select
                  value={exam}
                  onChange={(e) => handleExamChange(e.target.value)}
                  style={selectStyle}
                >
                  {EXAMS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={selectStyle}
                >
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Number of Questions</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {COUNT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      border:
                        count === c
                          ? "1px solid transparent"
                          : "1px solid rgba(255,255,255,.1)",
                      background: count === c ? G.grad : "transparent",
                      color: count === c ? "#111827" : "#94A3B8",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: "100%",
                background: G.grad,
                border: "none",
                color: "#111827",
                padding: "13px",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: ".95rem",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Generating..." : "Start Practice"}
            </button>

            {error && (
              <p style={{ color: "#EF4444", fontSize: ".85rem", marginTop: "10px" }}>
                {error}
              </p>
            )}
          </div>
        )}

        {stage === "quiz" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <span style={{ color: "#94A3B8", fontSize: ".85rem" }}>
                {answers.filter((a) => a !== -1).length} / {questions.length}{" "}
                answered
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {questions.map((q, qIndex) => (
                <div key={qIndex} style={{ ...G.card, padding: "18px" }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: ".95rem",
                      marginBottom: "12px",
                    }}
                  >
                    {qIndex + 1}. {q.question}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {q.options.map((opt, optIndex) => {
                      const selected = answers[qIndex] === optIndex;
                      return (
                        <label
                          key={optIndex}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: selected
                              ? "1px solid #F59E0B"
                              : "1px solid rgba(255,255,255,.08)",
                            background: selected
                              ? "rgba(245,158,11,.08)"
                              : "transparent",
                            cursor: "pointer",
                            fontSize: ".88rem",
                          }}
                        >
                          <input
                            type="radio"
                            name={`q-${qIndex}`}
                            checked={selected}
                            onChange={() => selectAnswer(qIndex, optIndex)}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: "100%",
                background: G.grad,
                border: "none",
                color: "#111827",
                padding: "14px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "1rem",
                marginTop: "20px",
              }}
            >
              Submit Practice
            </button>
          </div>
        )}

        {stage === "result" && (
          <div>
            <div
              style={{
                ...G.card,
                padding: "22px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "2.6rem",
                  fontWeight: 800,
                  ...G.gradText,
                  marginBottom: "6px",
                }}
              >
                {scoring.accuracy}%
              </div>
              <p style={{ color: "#94A3B8", marginBottom: "16px" }}>Accuracy</p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#22C55E" }}>
                    {scoring.correct}
                  </div>
                  <div style={{ color: "#64748B", fontSize: ".78rem" }}>Correct</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#EF4444" }}>
                    {scoring.wrong}
                  </div>
                  <div style={{ color: "#64748B", fontSize: ".78rem" }}>Wrong</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#94A3B8" }}>
                    {scoring.skipped}
                  </div>
                  <div style={{ color: "#64748B", fontSize: ".78rem" }}>Skipped</div>
                </div>
              </div>

              <p style={{ color: "#CBD5E1", fontSize: ".9rem", lineHeight: 1.6 }}>
                {improvementMessage(scoring.accuracy)}
              </p>

              {saveError && (
                <p style={{ color: "#F59E0B", fontSize: ".8rem", marginTop: "10px" }}>
                  {saveError}
                </p>
              )}
            </div>

            {scoring.weakTopics.length > 0 && (
              <div style={{ ...G.card, padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Where You Need to Improve
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {scoring.weakTopics.map(({ topic, count }) => (
                    <div
                      key={topic}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: ".88rem" }}>{topic}</span>
                      <span
                        style={{
                          fontSize: ".75rem",
                          color: "#EF4444",
                          fontWeight: 700,
                        }}
                      >
                        {count} wrong
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scoring.wrong > 0 && (
              <div style={{ ...G.card, padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "14px" }}>
                  Wrong Answers — Review
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {questions.map((q, i) => {
                    if (answers[i] === q.correctIndex || answers[i] === -1) {
                      return null;
                    }
                    return (
                      <div
                        key={i}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,.06)",
                          paddingBottom: "14px",
                        }}
                      >
                        <p style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: "8px" }}>
                          {i + 1}. {q.question}
                        </p>
                        <p style={{ color: "#EF4444", fontSize: ".85rem", marginBottom: "4px" }}>
                          Your answer: {q.options[answers[i]]}
                        </p>
                        <p style={{ color: "#22C55E", fontSize: ".85rem", marginBottom: "4px" }}>
                          Correct answer: {q.options[q.correctIndex]}
                        </p>
                        <p style={{ color: "#94A3B8", fontSize: ".82rem" }}>
                          {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleRestart}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(255,255,255,.1)",
                color: "white",
                padding: "13px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Practice Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}