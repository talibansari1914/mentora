"use client";

import { G } from "@/constants/colors";

interface HeaderProps {
  firstName: string;
  exam: string;
  initials: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onRefresh: () => void;
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
}: HeaderProps) {
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
            border: "1px solid rgba(255,255,255,.08)",
            background: "#111827",
            color: "white",
            cursor: "pointer",
            fontSize: "1.15rem",
            flexShrink: 0,
          }}
        >
          ☰
        </button>

        <div style={{ minWidth: 0 }}>
          <p style={{ color: "#94A3B8", fontSize: ".9rem", marginBottom: "4px" }}>{greeting()},</p>
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
            <span style={G.gradText}>{firstName}</span>
          </h1>
          <p style={{ color: "#64748B", marginTop: "4px", fontSize: ".92rem" }}>
            {exam} Preparation Dashboard
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
        <button
          onClick={onRefresh}
          style={{
            background: G.grad,
            border: "none",
            color: "#111827",
            padding: "10px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 700,
            transition: "opacity .15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.9")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          Refresh
        </button>

        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: G.grad,
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            color: "#111827",
            fontSize: "1rem",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}