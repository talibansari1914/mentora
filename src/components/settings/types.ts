export type SettingsTab =
  | "profile"
  | "privacy"
  | "study"
  | "ai"
  | "learning"
  | "analytics"
  | "notifications"
  | "appearance"
  | "language"
  | "help"
  | "about";

export interface SettingsNavItem {
  value: SettingsTab;
  label: string;
  icon: string | React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  description?: string;
}

export interface SettingsTabGroup {
  title: string;
  items: SettingsNavItem[];
}