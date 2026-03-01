export const tokens = {
  colors: {
    background: "#f3f4f6",
    surface: "#ffffff",
    border: "#e5e7eb",
    textPrimary: "#111827",
    textSecondary: "#4b5563",
    muted: "#9ca3af",
  },
  typography: {
    h1: {
      fontSize: "2rem",
      lineHeight: "2.5rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "1.5rem",
      lineHeight: "2rem",
      fontWeight: 600,
    },
    body: {
      fontSize: "1rem",
      lineHeight: "1.5rem",
      fontWeight: 400,
    },
    small: {
      fontSize: "0.875rem",
      lineHeight: "1.25rem",
      fontWeight: 400,
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
  shadows: {
    subtle: "0 1px 2px rgba(17, 24, 39, 0.06)",
    medium: "0 8px 20px rgba(17, 24, 39, 0.1)",
  },
} as const;

export type DesignTokens = typeof tokens;
