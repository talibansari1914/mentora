"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, LogOut, Settings } from "lucide-react";
import { G } from "@/constants/colors";
import { authService } from "@/services/authService";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { getErrorMessage } from "@/lib/errors";

interface HeaderProps {
  firstName: string;
  exam: string;
  initials: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onRefresh: () => void;
  // Hides "Upgrade My Plan" from the profile menu for users who already
  // have Premium - same reasoning as the Sidebar's upsell box.
  isPremium?: boolean;
}

// Returns a time-of-day greeting ("Good Morning" / "Good Afternoon" / "Good Evening").
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Header({
  firstName,
  exam,
  initials,
  isSidebarOpen,
  onToggleSidebar,
  onRefresh,
  isPremium,
}: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking anywhere outside it.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await authService.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Could not sign out:", getErrorMessage(err));
      setSigningOut(false);
    }
  }

  return (
    <header
      className="dashboard-header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        gap: "20px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
        {/* Hamburger button — only shown on mobile/tablet via CSS (see
            .sidebar-toggle-btn rule in page.tsx); the sidebar is always
            visible on desktop, so there's nothing to toggle there. */}
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
            background: "var(--theme-card-bg, #111827)",
            color: "var(--theme-text-main, #F8FAFC)",
            cursor: "pointer",
            fontSize: "1.15rem",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--theme-accent-border, rgba(245, 158, 11, 0.3))";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--theme-border, rgba(255, 255, 255, 0.08))";
          }}
        >
          ☰
        </button>

        <div style={{ minWidth: 0 }}>
          <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: "0.9rem", marginBottom: "2px", fontWeight: 500 }}>
            {greeting()},
          </p>
          <h1
            className="dashboard-greeting-title"
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                background: "var(--theme-accent-gradient, linear-gradient(135deg, #F59E0B 0%, #D97706 100%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {firstName}
            </span>
            <span style={{ marginLeft: "8px", display: "inline-block" }}>👋</span>
          </h1>
          <p style={{ color: "var(--theme-muted-text, #64748B)", marginTop: "2px", fontSize: "0.88rem", fontWeight: 500 }}>
            {exam} Preparation Dashboard
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell />

        <button
          onClick={onRefresh}
          style={{
            background: "var(--theme-accent-soft, rgba(245, 158, 11, 0.12))",
            border: "1px solid var(--theme-accent-border, rgba(245, 158, 11, 0.25))",
            color: "var(--theme-accent, #F59E0B)",
            padding: "10px 20px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.875rem",
            transition: "all 0.18s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--theme-accent-gradient, linear-gradient(135deg, #F59E0B 0%, #D97706 100%))";
            (e.currentTarget as HTMLElement).style.color = "var(--theme-accent-text, #000000)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 4px 14px var(--theme-accent-glow, rgba(245, 158, 11, 0.3))";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--theme-accent-soft, rgba(245, 158, 11, 0.12))";
            (e.currentTarget as HTMLElement).style.color = "var(--theme-accent, #F59E0B)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          Refresh
        </button>

        {/* Avatar — click to open Settings / Logout menu */}
        <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              background: "var(--theme-accent-gradient, linear-gradient(135deg, #F59E0B 0%, #D97706 100%))",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              color: "var(--theme-accent-text, #000000)",
              fontSize: "0.95rem",
              flexShrink: 0,
              boxShadow: "0 4px 14px var(--theme-accent-glow, rgba(245, 158, 11, 0.35))",
              border: "2px solid var(--theme-bg-main, #0A0D14)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {initials}
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "56px",
                right: 0,
                minWidth: "180px",
                background: "var(--theme-card-bg, #111827)",
                border: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
                borderRadius: "14px",
                boxShadow: "0 12px 28px -8px rgba(0, 0, 0, 0.45)",
                overflow: "hidden",
                zIndex: 200,
              }}
            >
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "var(--theme-text-main, #F8FAFC)",
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--theme-hover-bg, rgba(255, 255, 255, 0.05))";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Settings size={16} style={{ color: "var(--theme-text-sub, #94A3B8)", flexShrink: 0 }} />
                <span>Settings</span>
              </Link>

              {!isPremium && (
                <Link
                  href="/upgrade"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "var(--theme-accent, #F59E0B)",
                    textDecoration: "none",
                    borderTop: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--theme-accent-soft, rgba(245, 158, 11, 0.08))";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Crown size={16} style={{ flexShrink: 0 }} />
                  <span>Upgrade My Plan</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                disabled={signingOut}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#EF4444",
                  background: "transparent",
                  border: "none",
                  borderTop: "1px solid var(--theme-border, rgba(255, 255, 255, 0.08))",
                  cursor: signingOut ? "not-allowed" : "pointer",
                  textAlign: "left",
                  opacity: signingOut ? 0.6 : 1,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!signingOut) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(239, 68, 68, 0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <LogOut size={16} style={{ flexShrink: 0 }} />
                <span>{signingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}