// Shared design tokens for the dashboard.
// Import this in any dashboard component instead of redefining colors,
// so the whole dashboard stays visually consistent from one place.

export const G = {
  // Main brand gradient (amber -> gold), used for buttons, progress bars, avatars.
  grad: "linear-gradient(135deg,#F59E0B,#FBBF24)",

  // Same gradient, but clipped to text for gradient-colored headings.
  gradText: {
    background: "linear-gradient(135deg,#F59E0B,#FBBF24)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties,

  // Default card style used by every panel/section on the dashboard.
  card: {
    background: "#0B1220",
    border: "1px solid rgba(255,255,255,.06)",
    borderRadius: "16px",
  } as React.CSSProperties,
};