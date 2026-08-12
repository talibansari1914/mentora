// Shared helper: applies the user's chosen Font Size (Settings → Appearance)
// by scaling the root <html> font-size. Every fontSize value across the app
// is written in rem units (rem = relative to the root font-size), so this
// one change cascades correctly everywhere without needing to touch any
// individual page or component.
//
// Used by both the Appearance settings picker (on change/save) and
// ThemeSync (when the value changes in another browser tab). Mirrors the
// same pattern as applyAccentColor in accentColor.ts.
//
// Note: the boot script in src/app/layout.tsx has its own copy of this same
// mapping written as a plain JS string, not a TypeScript import — same
// reason as accentColor's boot-script copy: it has to run synchronously in
// a raw <script> tag in <head>, before the page's JS bundle loads, purely
// to avoid a flash of the wrong text size on first paint.

export type FontSize = "Small" | "Medium" | "Large";

const FONT_SIZE_SCALE: Record<FontSize, string> = {
  Small: "93.75%",
  Medium: "100%",
  Large: "112.5%",
};

export function applyFontSize(size: string) {
  document.documentElement.style.fontSize = FONT_SIZE_SCALE[size as FontSize] ?? FONT_SIZE_SCALE.Medium;
}