// Shared helper: applies a hex accent color to the CSS custom properties
// used throughout the app for buttons, badges, and glows. Used by both the
// Appearance settings picker (when a swatch is clicked/saved) and ThemeSync
// (when the color changes in another browser tab).
//
// Note: the boot script in src/app/layout.tsx has its own copy of this same
// logic written as a plain JS string, not a TypeScript import — that's
// intentional and can't be de-duplicated the same way. It has to run
// synchronously in a raw <script> tag in <head> before the page's JS bundle
// loads, purely to avoid a flash of the wrong accent color on first paint.

// Mixes a hex color toward white by `amount` (0-1) to produce a lighter
// shade for gradient endpoints. e.g. lighten("#3B82F6", 0.35) -> a lighter blue.
function lightenHex(r: number, g: number, b: number, amount: number): string {
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

export function applyAccentColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const light = lightenHex(r, g, b, 0.35);
  const style = document.documentElement.style;
  style.setProperty("--theme-accent", hex);
  style.setProperty("--theme-accent-soft", `rgba(${r},${g},${b},0.12)`);
  style.setProperty("--theme-accent-border", `rgba(${r},${g},${b},0.35)`);
  style.setProperty("--theme-accent-glow", `rgba(${r},${g},${b},0.3)`);
  // These two were previously never set anywhere, so every gradient token
  // in constants/colors.ts, lib/theme.ts, components/settings/shared.tsx,
  // and the Sidebar/Header always fell back to their hardcoded default
  // amber color regardless of the user's chosen accent. Setting them here
  // makes gradients actually follow the selected accent color.
  style.setProperty("--theme-accent-light", light);
  style.setProperty(
    "--theme-accent-gradient",
    `linear-gradient(135deg, ${hex} 0%, ${light} 100%)`
  );
}