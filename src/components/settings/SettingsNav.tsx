"use client";

import {
  User,
  Shield,
  BookOpen,
  Bot,
  Target,
  BarChart3,
  Bell,
  Palette,
  Globe,
  HelpCircle,
  Info,
  type LucideIcon,
} from "lucide-react";
import type { SettingsTab } from "./types";

interface NavItem {
  value: SettingsTab;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: "Account",
    items: [
      { value: "profile", label: "Profile", icon: User },
      { value: "privacy", label: "Privacy & Security", icon: Shield },
    ],
  },
  {
    title: "Study",
    items: [
      { value: "study", label: "Study Preferences", icon: BookOpen },
      { value: "ai", label: "AI Mentor", icon: Bot },
      { value: "learning", label: "Learning", icon: Target },
      { value: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "App",
    items: [
      { value: "notifications", label: "Notifications", icon: Bell },
      { value: "appearance", label: "Appearance", icon: Palette },
      { value: "language", label: "Language & Region", icon: Globe },
    ],
  },
  {
    title: "More",
    items: [
      { value: "help", label: "Help & Support", icon: HelpCircle },
      { value: "about", label: "About", icon: Info },
    ],
  },
];

export default function SettingsNav({
  active,
  onChange,
}: {
  active: SettingsTab;
  onChange: (t: SettingsTab) => void;
}) {
  return (
    <nav style={{ width: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 768px) {
          .settings-nav-container {
            display: flex;
            flex-direction: row !important;
            overflow-x: auto;
            gap: 8px;
            padding-bottom: 8px;
            scrollbar-width: none;
          }
          .settings-nav-container::-webkit-scrollbar {
            display: none;
          }
          .settings-group {
            margin-bottom: 0 !important;
            flex-shrink: 0;
          }
          .settings-group-title {
            display: none !important;
          }
          .settings-group-items {
            flex-direction: row !important;
          }
          .settings-nav-btn {
            white-space: nowrap;
            padding: 8px 14px !important;
            font-size: 0.82rem !important;
            background: var(--theme-card-bg, rgba(150, 150, 150, 0.05)) !important;
            border: 1px solid var(--theme-border, rgba(150, 150, 150, 0.15)) !important;
          }
        }
      `}</style>

      <div className="settings-nav-container" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {GROUPS.map((group) => (
          <div key={group.title} className="settings-group" style={{ marginBottom: "16px" }}>
            <p
              className="settings-group-title"
              style={{
                color: "var(--theme-text-sub, #64748B)",
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
                padding: "0 12px",
              }}
            >
              {group.title}
            </p>
            <div className="settings-group-items" style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.value;

                return (
                  <button
                    key={item.value}
                    className="settings-nav-btn"
                    onClick={() => onChange(item.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "none",
                      background: isActive
                        ? "var(--theme-accent-soft, rgba(245, 158, 11, 0.12))"
                        : "transparent",
                      color: isActive
                        ? "var(--theme-accent, #F59E0B)"
                        : "var(--theme-text-sub, #94A3B8)",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.18s ease-out",
                    }}
                  >
                    <Icon
                      size={18}
                      style={{
                        flexShrink: 0,
                        color: isActive
                          ? "var(--theme-accent, #F59E0B)"
                          : "var(--theme-text-sub, #94A3B8)",
                      }}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}