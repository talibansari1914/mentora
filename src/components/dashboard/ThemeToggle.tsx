"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read the theme that the layout script already set
    const currentTheme =
      (document.documentElement.getAttribute("data-theme") as "dark" | "light") ||
      (localStorage.getItem("theme") as "dark" | "light") ||
      "dark";

    setTheme(currentTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // To prevent an SSR hydration flicker
  if (!mounted) {
    return (
      <div
        style={{
          width: "82px",
          height: "36px",
          borderRadius: "10px",
          background: "var(--theme-hover-bg, rgba(255, 255, 255, 0.05))",
          border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.1))",
        }}
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: "var(--theme-hover-bg, rgba(255, 255, 255, 0.05))",
        border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.1))",
        color: "var(--theme-text-main, #F8FAFC)",
        padding: "8px 14px",
        borderRadius: "10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "0.82rem",
        fontWeight: 600,
        transition: "all 0.18s ease-out",
      }}
      title="Toggle Light/Dark Theme"
    >
      {theme === "dark" ? (
        <>
          <Sun size={16} style={{ color: "var(--theme-accent, #F59E0B)" }} />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon size={16} style={{ color: "#3B82F6" }} />
          <span>Dark</span>
        </>
      )}
    </button>
  );
}