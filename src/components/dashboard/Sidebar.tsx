"use client";

import Link from "next/link";
import { NAV_ITEMS, TOOLS_ITEMS, NavItem, filterNavItemsByExam } from "@/constants/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan: string;
  // The user's exam (e.g. "UPSC", "GATE") - used to filter which nav
  // items show up. See filterNavItemsByExam() in constants/navigation.ts
  // for exactly which items are exam-restricted and why.
  exam?: string;
  // Hides the "Upgrade Now" upsell box for users who already have
  // Premium - showing it to a paying customer looks like a bug, not
  // an upsell.
  isPremium?: boolean;
}

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <p
        style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--theme-muted-text, #475569)",
          padding: "0 12px",
          marginBottom: "6px",
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
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            marginBottom: "3px",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: item.active ? 600 : 500,
            color: item.active
              ? "var(--theme-accent, #F59E0B)"
              : "var(--theme-text-sub, #94A3B8)",
            background: item.active
              ? "var(--theme-accent-soft, rgba(245, 158, 11, 0.12))"
              : "transparent",
            boxShadow: item.active
              ? "inset 0 0 0 1px var(--theme-accent-border, rgba(245, 158, 11, 0.25))"
              : "none",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            if (!item.active) {
              (e.currentTarget as HTMLElement).style.background =
                "var(--theme-hover-bg, rgba(255, 255, 255, 0.05))";
              (e.currentTarget as HTMLElement).style.color =
                "var(--theme-text-main, #F8FAFC)";
            }
          }}
          onMouseLeave={(e) => {
            if (!item.active) {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color =
                "var(--theme-text-sub, #94A3B8)";
            }
          }}
        >
          {item.active && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "15%",
                bottom: "15%",
                width: "3.5px",
                borderRadius: "0 4px 4px 0",
                background: "var(--theme-accent-gradient, linear-gradient(135deg, #F59E0B, #D97706))",
                boxShadow: "0 0 8px var(--theme-accent-glow, rgba(245, 158, 11, 0.6))",
              }}
            />
          )}

          <span style={{ fontSize: "1.05rem", flexShrink: 0, display: "flex", alignItems: "center" }}>
            {item.icon}
          </span>
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
                fontSize: "0.62rem",
                fontWeight: 800,
                color: "var(--theme-accent, #F59E0B)",
                background: "var(--theme-accent-soft, rgba(245, 158, 11, 0.12))",
                border: "1px solid var(--theme-accent-border, rgba(245, 158, 11, 0.25))",
                borderRadius: "100px",
                padding: "2px 8px",
                flexShrink: 0,
              }}
            >
              {item.badge}
            </span>
          )}

          {item.pro && (
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 800,
                color: "#A78BFA",
                background: "rgba(167, 139, 250, 0.12)",
                border: "1px solid rgba(167, 139, 250, 0.25)",
                borderRadius: "100px",
                padding: "2px 8px",
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

export default function Sidebar({ isOpen, onClose, userPlan, exam, isPremium }: SidebarProps) {
  const visibleNavItems = filterNavItemsByExam(NAV_ITEMS, exam);
  const visibleToolsItems = filterNavItemsByExam(TOOLS_ITEMS, exam);

  return (
    <>
      {isOpen && (
        <div
          className="dashboard-overlay"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 90,
          }}
        />
      )}

      <aside
        className="dashboard-sidebar"
        style={{
          width: "280px",
          background: "var(--theme-sidebar-bg, #0A0D14)",
          borderRight: "1px solid var(--theme-border, rgba(255, 255, 255, 0.07))",
          padding: "24px 18px",
          position: "fixed",
          left: isOpen ? 0 : "-300px",
          top: 0,
          bottom: 0,
          zIndex: 100,
          transition: "left 0.25s ease-out",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "30px", paddingLeft: "4px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "var(--theme-accent-gradient, linear-gradient(135deg, #F59E0B 0%, #D97706 100%))",
                display: "grid",
                placeItems: "center",
                color: "var(--theme-accent-text, #000000)",
                fontWeight: 900,
                fontSize: "1.2rem",
                flexShrink: 0,
                boxShadow: "0 4px 16px var(--theme-accent-glow, rgba(245, 158, 11, 0.35))",
              }}
            >
              M
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--theme-text-main, #F8FAFC)" }}>
                Mentora
              </div>
              <div style={{ color: "var(--theme-text-sub, #64748B)", fontSize: "0.78rem", fontWeight: 500 }}>
                Learn Smarter
              </div>
            </div>
          </div>

          <NavSection label="MAIN" items={visibleNavItems} />
          <NavSection label="TOOLS" items={visibleToolsItems} />
        </div>

        {!isPremium && (
          <div
            style={{
              marginTop: "28px",
              padding: "18px",
              borderRadius: "18px",
              background: "var(--theme-card-bg-alt, rgba(245, 158, 11, 0.05))",
              border: "1px solid var(--theme-accent-border, rgba(245, 158, 11, 0.2))",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--theme-accent, #F59E0B)", fontWeight: 800, marginBottom: "6px", textTransform: "uppercase" }}>
              {userPlan}
            </div>
            <h4 style={{ fontSize: "0.95rem", marginBottom: "6px", fontWeight: 700, color: "var(--theme-text-main, #F8FAFC)" }}>
              Unlock Premium Features
            </h4>
            <p style={{ color: "var(--theme-text-sub, #94A3B8)", fontSize: "0.78rem", lineHeight: 1.5, marginBottom: "16px" }}>
              Access AI Mentor, Unlimited Mock Tests, Notes Generator and Advanced Analytics.
            </p>
            <a
              href="/upgrade"
              style={{
                display: "block",
                width: "100%",
                background: "var(--theme-accent-gradient, linear-gradient(135deg, #F59E0B 0%, #D97706 100%))",
                border: "none",
                color: "var(--theme-accent-text, #000000)",
                padding: "11px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "0.85rem",
                boxShadow: "0 4px 14px var(--theme-accent-glow, rgba(245, 158, 11, 0.25))",
                textAlign: "center",
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Upgrade Now
            </a>
          </div>
        )}
      </aside>
    </>
  );
}