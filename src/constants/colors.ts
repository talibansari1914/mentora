// Shared design tokens for the dashboard.
// Uses CSS variables for dynamic theme switching with Gold/Amber defaults.

export const G = {
  // Dynamic brand gradient using CSS variables (Gold/Amber default)
  grad: "linear-gradient(135deg, var(--theme-accent, #F59E0B), var(--theme-accent-light, #FBBF24))",

  // Dynamic gradient clipped to text for headings
  gradText: {
    background: "linear-gradient(135deg, var(--theme-accent, #F59E0B), var(--theme-accent-light, #FBBF24))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties,

  // Dynamic card style for dashboard panels/sections
  card: {
    background: "var(--theme-card-bg, #0B1220)",
    border: "var(--theme-card-border, 1px solid rgba(255, 255, 255, 0.06))",
    borderRadius: "16px",
  } as React.CSSProperties,
};