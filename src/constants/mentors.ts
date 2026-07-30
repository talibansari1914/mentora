import { MentorCategory } from "@/types/mentor";

export const CATEGORIES: { value: MentorCategory; label: string; icon: string }[] = [
  { value: "academic", label: "Academic Mentors", icon: "👨‍🏫" },
  { value: "skill", label: "Skill Mentors", icon: "💻" },
  { value: "career", label: "Career Mentors", icon: "💼" },
];

export const CATEGORY_COLORS: Record<MentorCategory, string> = {
  academic: "linear-gradient(135deg,#F59E0B,#FBBF24)", // amber — matches app brand
  skill: "linear-gradient(135deg,#3B82F6,#06B6D4)", // blue
  career: "linear-gradient(135deg,#8B5CF6,#A855F7)", // purple
};

export function categoryColor(category: MentorCategory) {
  return CATEGORY_COLORS[category] ?? "linear-gradient(135deg,#64748B,#475569)";
}

export const SESSION_TYPES = [
  "1-on-1 Live Session",
  "Doubt Solving",
  "Mock Interview",
  "Career Guidance",
  "Strategy Session",
  "Revision Session",
];

export const LANGUAGES_FILTER = ["Any", "Hindi", "English"];

export const EXPERIENCE_FILTER = [
  { label: "Any", min: 0 },
  { label: "2+ years", min: 2 },
  { label: "5+ years", min: 5 },
  { label: "10+ years", min: 10 },
];

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top Rated" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "experience", label: "Most Experienced" },
];