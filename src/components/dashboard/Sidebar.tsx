"use client";

import Link from "next/link";
import { G } from "@/constants/colors";
import { NAV_ITEMS, TOOLS_ITEMS, NavItem } from "@/constants/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan: string;
}

// Renders one labeled group of nav links (e.g. "MAIN" or "TOOLS").
function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <p
        style={{
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#334155",
          padding: "0 12px",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>

      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 12px",
            borderRadius: "10px",
            marginBottom: "2px",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: item.active ? "#F59E0B" : "#64748B",
            background: item.active ? "rgba(245,158,11,0.08)" : "transparent",
            transition: "all 0.18s",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            if (!item.active) {
              (e.currentTarget as HTMLElement).style.background = "#1A2640";
              (e.currentTarget as HTMLElement).style.color = "#CBD5E1";
            }
          }}
          onMouseLeave={(e) => {
            if (!item.active) {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#64748B";
            }
          }}
        >
          {/* Active-page indicator bar on the left edge */}
          {item.active && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "20%",
                bottom: "20%",
                width: "3px",
                borderRadius: "0 2px 2px 0",
                background: G.grad,
              }}
            />
          )}

          <span style={{ fontSize: "1rem", flexShrink: 0 }}>{item.icon}</span>
          <span
            style={{
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {item.label}
          </span>

          {item.badge && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#F59E0B",
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "100px",
                padding: "2px 7px",
                flexShrink: 0,
              }}
            >
              {item.badge}
            </span>
          )}

          {item.pro && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#818CF8",
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "100px",
                padding: "2px 7px",
                flexShrink: 0,
              }}
            >
              Pro
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose, userPlan }: SidebarProps) {
  return (
    <>
      {/* Dark overlay behind the sidebar on mobile — tapping it closes the menu.
          Hidden on desktop via CSS (see dashboard-overlay class in page.tsx's
          responsive stylesheet) since the sidebar is always visible there. */}
      {isOpen && (
        <div
          className="dashboard-overlay"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            zIndex: 90,
          }}
        />
      )}

      {/* NOTE: `left` here is the MOBILE default (hidden unless toggled open).
          On desktop, the "dashboard-sidebar" class forces left:0 regardless
          of `isOpen` — see the @media rule in page.tsx — so the sidebar is
          always visible on larger screens without needing the hamburger. */}
      <aside
        className="dashboard-sidebar"
        style={{
          width: "280px",
          background: "#0B1220",
          borderRight: "1px solid rgba(255,255,255,.06)",
          padding: "20px 16px",
          position: "fixed",
          left: isOpen ? 0 : "-300px",
          top: 0,
          bottom: 0,
          zIndex: 100,
          transition: ".25s ease",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "26px" }}>
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "14px",
              background: G.grad,
              display: "grid",
              placeItems: "center",
              color: "#111827",
              fontWeight: 800,
              fontSize: "1.05rem",
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Mentora</div>
            <div style={{ color: "#94A3B8", fontSize: ".78rem" }}>Learn Smarter</div>
          </div>
        </div>

        <NavSection label="MAIN" items={NAV_ITEMS} />
        <NavSection label="TOOLS" items={TOOLS_ITEMS} />

        {/* Upgrade-to-premium promo card */}
        <div
          style={{
            marginTop: "28px",
            padding: "16px",
            borderRadius: "16px",
            background: "linear-gradient(135deg,#1E293B,#0F172A)",
            border: "1px solid rgba(245,158,11,.12)",
          }}
        >
          <div style={{ fontSize: ".72rem", color: "#F59E0B", fontWeight: 700, marginBottom: "8px" }}>
            {userPlan}
          </div>
          <h4 style={{ fontSize: ".95rem", marginBottom: "8px", fontWeight: 700 }}>
            Unlock Premium Features
          </h4>
          <p style={{ color: "#94A3B8", fontSize: ".78rem", lineHeight: 1.5, marginBottom: "14px" }}>
            Access AI Mentor, Unlimited Mock Tests, Notes Generator and Advanced Analytics.
          </p>
          <button
            onClick={() => alert("Premium plans are coming soon!")}
            style={{
              width: "100%",
              background: G.grad,
              border: "none",
              color: "#111827",
              padding: "11px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
              transition: "opacity .15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            Upgrade
          </button>
        </div>
      </aside>
    </>
  );
}