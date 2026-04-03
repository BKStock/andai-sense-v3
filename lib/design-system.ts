export const colors = {
  bgVoid: "#010205",
  bgBase: "#030710",
  bgSurface: "#060D1C",
  bgRaised: "#0A1428",
  bgOverlay: "#0F1C35",
  bgHover: "#142040",
  cyan300: "#00E5FF",
  cyan400: "#00D4F5",
  cyan500: "#00B8D9",
  red: "#FF3B3B",
  amber: "#FFB800",
  green: "#00FF88",
  textPrimary: "#EDF2FF",
  textSecondary: "#8896B3",
  textMuted: "#3D4F6E",
  borderDefault: "rgba(0, 229, 255, 0.12)",
} as const;

export const urgencyColors: Record<string, string> = {
  CRITICAL: "#FF3B3B",
  HIGH: "#FFB800",
  MEDIUM: "#00B8D9",
  LOW: "#8896B3",
};

export const urgencyBorderColors: Record<string, string> = {
  CRITICAL: "#FF3B3B",
  HIGH: "#FFB800",
  MEDIUM: "#00B8D9",
  LOW: "#3D4F6E",
};

export type UrgencyLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export const cardStyle: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border-default)",
  boxShadow: "var(--shadow-card)",
  borderRadius: "8px",
};
