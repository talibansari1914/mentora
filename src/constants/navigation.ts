// Sidebar navigation data.
// Kept separate from the Sidebar component so links can be updated here
// without touching any layout/rendering code.

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
  badge?: string;
  pro?: boolean;
}

// Main navigation section (top of the sidebar).
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "🏠", active: true },
  { label: "Library", href: "/library", icon: "📚" },
  { label: "Mentor Booking", href: "/mentors", icon: "🎓" },
  { label: "Mock Tests", href: "/mock-tests", icon: "📝" },
  { label: "PYQs", href: "/pyqs", icon: "📄" },
  { label: "Daily Practice", href: "/practice", icon: "🎯" },
  { label: "Study Planner", href: "/planner", icon: "🗓️" },
  { label: "Memory Assistant", href: "/memory", icon: "🧠" },
  { label: "AI Coding Mentor", href: "/coding-mentor", icon: "💻" },
  { label: "Writing Assistant", href: "/writing-assistant", icon: "✍️" },
  { label: "Analytics", href: "/analytics", icon: "📊" },
  { label: "AI Mentor", href: "/mentor", icon: "🤖", badge: "AI" },
];

// Secondary "Tools" section (bottom of the sidebar).
export const TOOLS_ITEMS: NavItem[] = [
  { label: "Notes Generator", href: "/notes", icon: "📒" },
  { label: "Video to Notes", href: "/video-to-notes", icon: "🎥", pro: true }, // <-- Yahan /video-notes se badal kar /video-to-notes kar diya hai
  { label: "Audio Revision", href: "/audio", icon: "🎧", pro: true },
  { label: "Question Bank", href: "/question-bank", icon: "❓" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];