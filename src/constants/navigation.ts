// Sidebar navigation data.
// Kept separate from the Sidebar component so links can be updated here
// without touching any layout/rendering code.

// Canonical exam values - must match authService.normalizeExam()'s output
// exactly (UPSC, JEE, NEET, SSC, BANKING, ENGINEERING, GATE, CAT), since
// that's the value Sidebar filters against (see dashboard/page.tsx, which
// passes USER.exam straight from the profile).
export type ExamCategory = "UPSC" | "JEE" | "NEET" | "SSC" | "BANKING" | "ENGINEERING" | "GATE" | "CAT";

const ALL_EXAMS: ExamCategory[] = ["UPSC", "JEE", "NEET", "SSC", "BANKING", "ENGINEERING", "GATE", "CAT"];

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
  badge?: string;
  pro?: boolean;
  // Which exams see this item. Omit entirely (undefined) for a genuinely
  // exam-agnostic tool - that's the default for most items here, since
  // most of this app's tools (notes, mock tests, PYQs, planner, etc.)
  // are equally useful no matter what exam someone is preparing for.
  // Only set this when a feature is tied to something a specific exam's
  // syllabus does or doesn't have - see the two exceptions below for the
  // reasoning behind each one.
  exams?: ExamCategory[];
}

// Main navigation section (top of the sidebar).
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "🏠", active: true },
  { label: "My Notes", href: "/my-notes", icon: "📓" },
  { label: "Library", href: "/library", icon: "📚" },
  { label: "Mentor Booking", href: "/mentors", icon: "🎓" },
  { label: "Mock Tests", href: "/mock-tests", icon: "📝" },
  { label: "PYQs", href: "/pyqs", icon: "📄" },
  { label: "Daily Practice", href: "/practice", icon: "🎯" },
  { label: "Study Planner", href: "/planner", icon: "🗓️" },
  { label: "Memory Assistant", href: "/memory", icon: "🧠" },
  // Coding is only in the syllabus for Engineering (placements/coursework)
  // and GATE (CS/IT branch) - not relevant prep for any other exam here.
  { label: "AI Coding Mentor", href: "/coding-mentor", icon: "💻", exams: ["ENGINEERING", "GATE"] },
  // Relevant wherever the exam has a descriptive/essay/interview
  // component: UPSC (Essay paper + Mains descriptive answers), SSC (CGL
  // Tier-3 descriptive paper), Banking (PO Mains descriptive/essay), CAT
  // (WAT-GD-PI process), Engineering (placement cover letters/emails),
  // GATE (M.Tech Statement of Purpose). JEE and NEET are both purely
  // objective 12th-grade entrance exams with no writing/interview
  // component, so this tool has nothing to do for those two right now.
  { label: "Writing Assistant", href: "/writing-assistant", icon: "✍️", exams: ["UPSC", "SSC", "BANKING", "CAT", "ENGINEERING", "GATE"] },
  { label: "Analytics", href: "/analytics", icon: "📊" },
  { label: "AI Mentor", href: "/mentor", icon: "🤖", badge: "AI" },
];

// Secondary "Tools" section (bottom of the sidebar).
export const TOOLS_ITEMS: NavItem[] = [
  { label: "Notes Generator", href: "/notes", icon: "📒" },
  { label: "Video to Notes", href: "/video-to-notes", icon: "🎥", pro: true }, // <-- Changed from /video-notes to /video-to-notes here
  { label: "Audio Revision", href: "/audio", icon: "🎧", pro: true },
  { label: "Question Bank", href: "/question-bank", icon: "❓" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];

// Filters a nav list down to what a given exam should see. An item with no
// `exams` array is universal and always passes. Falls back to showing
// everything if `exam` is missing/unrecognized (e.g. profile still
// loading) rather than hiding tools during that brief window.
export function filterNavItemsByExam(items: NavItem[], exam: string | undefined | null): NavItem[] {
  const normalized = (exam ?? "").toUpperCase() as ExamCategory;
  if (!ALL_EXAMS.includes(normalized)) return items;
  return items.filter((item) => !item.exams || item.exams.includes(normalized));
}