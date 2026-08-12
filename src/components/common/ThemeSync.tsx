"use client";

import { useEffect } from "react";
import { applyAccentColor } from "@/lib/accentColor";
import { applyFontSize } from "@/lib/fontSize";

// Keeps the theme, accent color, and font size in sync across browser
// tabs. The boot script in layout.tsx only runs once per fresh page load,
// so if a user changes one of these in one tab, any other tabs they
// already have open won't reflect the change until this listener picks up
// the "storage" event that fires in OTHER tabs when localStorage changes.
export default function ThemeSync() {
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      // "storage" only fires in OTHER tabs/windows of the same origin, never
      // in the tab that made the change — exactly what we want here.
      if (e.key === "theme" && e.newValue) {
        document.documentElement.setAttribute("data-theme", e.newValue);
      }
      if (e.key === "accentColor" && e.newValue) {
        applyAccentColor(e.newValue);
      }
      if (e.key === "fontSize" && e.newValue) {
        applyFontSize(e.newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}