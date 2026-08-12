// ══════════════════════════════════════════
// src/lib/questionBank.ts
// SAB EXAM KE QUESTIONS YAHAN HAIN — exam-wise organized
// Baad mein yeh backend/database se aayega
// ══════════════════════════════════════════

export type Question = {
  id: number;
  subject: string;
  text: string;
  options: string[];
  correct: number;
};

export type TestMeta = {
  id: string;
  title: string;
  exam: "jee" | "neet" | "upsc" | "ssc";
  duration: number; // minutes
  negMark: boolean;
  // When set, getQuestionsForTest only pulls questions tagged with this
  // subject instead of the exam's full mixed pool — so a test titled
  // "Mechanics — Topic Test" actually gives Physics questions instead of
  // a random mix of Physics/Chemistry/Maths, and doesn't fully overlap
  // with unrelated topic tests from the same exam.
  topicSubject?: string;
};

// ───── JEE Questions ─────
const JEE_QUESTIONS: Question[] = [
  { id: 1, subject: "Physics", text: "A particle moves in a circle of radius r with constant speed v. What is the magnitude of its acceleration?", options: ["v/r", "v²/r", "vr", "v²r"], correct: 1 },
  { id: 2, subject: "Physics", text: "The SI unit of electric flux is:", options: ["Weber", "Volt-meter", "Newton/Coulomb", "Tesla"], correct: 1 },
  { id: 3, subject: "Physics", text: "Which law states that current is directly proportional to voltage?", options: ["Faraday's Law", "Ohm's Law", "Lenz's Law", "Coulomb's Law"], correct: 1 },
  { id: 4, subject: "Physics", text: "The escape velocity from Earth's surface is approximately:", options: ["7.9 km/s", "9.8 km/s", "11.2 km/s", "15.0 km/s"], correct: 2 },
  { id: 5, subject: "Chemistry", text: "Which of the following has the highest boiling point?", options: ["HF", "HCl", "HBr", "HI"], correct: 0 },
  { id: 6, subject: "Chemistry", text: "The oxidation state of Mn in KMnO₄ is:", options: ["+5", "+6", "+7", "+4"], correct: 2 },
  { id: 7, subject: "Chemistry", text: "What is the hybridization of carbon in methane (CH₄)?", options: ["sp", "sp²", "sp³", "sp³d"], correct: 2 },
  { id: 8, subject: "Maths", text: "If f(x) = x³ - 3x + 2, find f'(x) at x = 2.", options: ["9", "12", "6", "15"], correct: 0 },
  { id: 9, subject: "Maths", text: "The value of ∫₀^π sin(x) dx is:", options: ["0", "1", "2", "π"], correct: 2 },
  { id: 10, subject: "Maths", text: "The number of ways to arrange 5 distinct objects is:", options: ["20", "60", "120", "24"], correct: 2 },
];

// ───── NEET Questions ─────
const NEET_QUESTIONS: Question[] = [
  { id: 1, subject: "Biology", text: "Which organelle is known as the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], correct: 2 },
  { id: 2, subject: "Biology", text: "The functional unit of the kidney is called:", options: ["Neuron", "Nephron", "Alveolus", "Hepatocyte"], correct: 1 },
  { id: 3, subject: "Biology", text: "DNA replication occurs during which phase of the cell cycle?", options: ["G1 phase", "S phase", "G2 phase", "M phase"], correct: 1 },
  { id: 4, subject: "Biology", text: "Which hormone regulates blood sugar levels?", options: ["Thyroxine", "Insulin", "Adrenaline", "Estrogen"], correct: 1 },
  { id: 5, subject: "Physics", text: "The unit of electric resistance is:", options: ["Ampere", "Volt", "Ohm", "Watt"], correct: 2 },
  { id: 6, subject: "Physics", text: "Which mirror is used in a vehicle's rear-view mirror?", options: ["Concave", "Convex", "Plane", "Cylindrical"], correct: 1 },
  { id: 7, subject: "Physics", text: "The SI unit of force is:", options: ["Joule", "Newton", "Pascal", "Watt"], correct: 1 },
  { id: 8, subject: "Chemistry", text: "Which gas is most abundant in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], correct: 2 },
  { id: 9, subject: "Chemistry", text: "The pH of pure water at 25°C is:", options: ["6", "7", "8", "0"], correct: 1 },
  { id: 10, subject: "Chemistry", text: "Which element has the atomic number 6?", options: ["Oxygen", "Nitrogen", "Carbon", "Boron"], correct: 2 },
];

// ───── UPSC Questions ─────
const UPSC_QUESTIONS: Question[] = [
  { id: 1, subject: "Polity", text: "Which Article of the Indian Constitution deals with the Right to Equality?", options: ["Article 14", "Article 19", "Article 21", "Article 32"], correct: 0 },
  { id: 2, subject: "Polity", text: "The Constitution of India was adopted on:", options: ["15 August 1947", "26 January 1950", "26 November 1949", "2 October 1950"], correct: 2 },
  { id: 3, subject: "Polity", text: "Who is the head of the Indian state?", options: ["Prime Minister", "Chief Justice", "President", "Speaker of Lok Sabha"], correct: 2 },
  { id: 4, subject: "History", text: "The Quit India Movement was launched in:", options: ["1940", "1942", "1945", "1947"], correct: 1 },
  { id: 5, subject: "History", text: "Who founded the Indian National Congress in 1885?", options: ["Mahatma Gandhi", "A.O. Hume", "Jawaharlal Nehru", "B.R. Ambedkar"], correct: 1 },
  { id: 6, subject: "History", text: "The Battle of Plassey was fought in:", options: ["1757", "1764", "1857", "1761"], correct: 0 },
  { id: 7, subject: "Geography", text: "Which is the longest river in India?", options: ["Yamuna", "Brahmaputra", "Ganga", "Godavari"], correct: 2 },
  { id: 8, subject: "Geography", text: "The Tropic of Cancer passes through how many Indian states?", options: ["6", "7", "8", "9"], correct: 2 },
  { id: 9, subject: "Economy", text: "The Reserve Bank of India was established in:", options: ["1935", "1947", "1950", "1969"], correct: 0 },
  { id: 10, subject: "Economy", text: "Which Five-Year Plan focused on the Green Revolution?", options: ["1st", "2nd", "3rd", "4th"], correct: 2 },
];

// ───── SSC Questions ─────
const SSC_QUESTIONS: Question[] = [
  { id: 1, subject: "Reasoning", text: "Find the odd one out: Dog, Cat, Lion, Sparrow", options: ["Dog", "Cat", "Lion", "Sparrow"], correct: 3 },
  { id: 2, subject: "Reasoning", text: "If A=1, B=2, C=3... what does 'CAB' equal?", options: ["312", "321", "213", "123"], correct: 0 },
  { id: 3, subject: "Quant", text: "What is 15% of 240?", options: ["32", "36", "40", "42"], correct: 1 },
  { id: 4, subject: "Quant", text: "If a train travels 360 km in 4 hours, its speed is:", options: ["80 km/h", "90 km/h", "100 km/h", "75 km/h"], correct: 1 },
  { id: 5, subject: "English", text: "Choose the correct synonym for 'Abundant':", options: ["Scarce", "Plentiful", "Limited", "Rare"], correct: 1 },
  { id: 6, subject: "English", text: "Identify the correctly spelled word:", options: ["Recieve", "Receive", "Receeve", "Receve"], correct: 1 },
  { id: 7, subject: "GK", text: "Who is known as the 'Father of the Indian Constitution'?", options: ["Mahatma Gandhi", "Jawaharlal Nehru", "B.R. Ambedkar", "Sardar Patel"], correct: 2 },
  { id: 8, subject: "GK", text: "The headquarters of the United Nations is located in:", options: ["Geneva", "Paris", "New York", "London"], correct: 2 },
  { id: 9, subject: "Quant", text: "The simple interest on ₹5000 at 8% per annum for 2 years is:", options: ["₹600", "₹700", "₹800", "₹900"], correct: 2 },
  { id: 10, subject: "Reasoning", text: "Complete the series: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "36"], correct: 1 },
];

export const QUESTION_BANKS: Record<string, Question[]> = {
  jee: JEE_QUESTIONS,
  neet: NEET_QUESTIONS,
  upsc: UPSC_QUESTIONS,
  ssc: SSC_QUESTIONS,
};

// Test metadata keyed by test id (from the hub page)
export const TEST_LOOKUP: Record<string, TestMeta> = {
  "1":  { id: "1",  title: "JEE Main Full Mock Test #14",        exam: "jee",  duration: 30, negMark: true },
  "2":  { id: "2",  title: "Mechanics — Topic Test",              exam: "jee",  duration: 20, negMark: true, topicSubject: "Physics" },
  "3":  { id: "3",  title: "Organic Chemistry — Chapter 8",       exam: "jee",  duration: 20, negMark: true, topicSubject: "Chemistry" },
  "4":  { id: "4",  title: "NEET Biology Full Mock #9",           exam: "neet", duration: 30, negMark: true, topicSubject: "Biology" },
  "5":  { id: "5",  title: "Human Physiology — Topic Test",       exam: "neet", duration: 15, negMark: true, topicSubject: "Biology" },
  "6":  { id: "6",  title: "NEET PYQ 2024 — Full Paper",          exam: "neet", duration: 30, negMark: true },
  "7":  { id: "7",  title: "UPSC Prelims Full Mock #21",          exam: "upsc", duration: 30, negMark: true },
  "8":  { id: "8",  title: "Indian Polity — Topic Test",          exam: "upsc", duration: 15, negMark: true, topicSubject: "Polity" },
  "9":  { id: "9",  title: "Modern History — Chapter Test",       exam: "upsc", duration: 15, negMark: true, topicSubject: "History" },
  "10": { id: "10", title: "UPSC Prelims PYQ 2023",               exam: "upsc", duration: 30, negMark: true },
  "11": { id: "11", title: "Daily Practice — Algebra",            exam: "jee",  duration: 10, negMark: false, topicSubject: "Maths" },
  "12": { id: "12", title: "Daily Practice — Cell Biology",       exam: "neet", duration: 10, negMark: false, topicSubject: "Biology" },
  "14": { id: "14", title: "Calculus Special — Topic Test",       exam: "jee",  duration: 20, negMark: true, topicSubject: "Maths" },
  "15": { id: "15", title: "SSC CGL Full Mock #7",                exam: "ssc",  duration: 20, negMark: true },
};

// Fisher-Yates shuffle — questions ka random order har attempt mein
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Get questions for a given test id — randomized order each time
export function getQuestionsForTest(testId: string): { meta: TestMeta; questions: Question[] } {
  const meta = TEST_LOOKUP[testId] || TEST_LOOKUP["1"];
  const bank = QUESTION_BANKS[meta.exam] || JEE_QUESTIONS;
  const scoped = meta.topicSubject
    ? bank.filter((q) => q.subject === meta.topicSubject)
    : bank;
  // Fallback: if a topic somehow has zero matching questions, don't return
  // an empty test — show the full pool rather than a blank screen.
  return { meta, questions: shuffleArray(scoped.length > 0 ? scoped : bank) };
}

// ══════════════════════════════════════════
// Result storage (localStorage) — demo "database"
// ══════════════════════════════════════════
export type TestResult = {
  testId: string;
  title: string;
  exam: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  timeUsed: number;
  date: string; // ISO string
  subjectBreakdown: { subject: string; correct: number; wrong: number; skipped: number; accuracy: number }[];
};

const STORAGE_KEY = "mentora_test_results";

export function saveTestResult(result: TestResult) {
  if (typeof window === "undefined") return;
  try {
    const existing = getTestResults();
    const updated = [result, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save test result", e);
  }
}

export function getTestResults(): TestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getLatestResult(): TestResult | null {
  const all = getTestResults();
  return all.length > 0 ? all[0] : null;
}