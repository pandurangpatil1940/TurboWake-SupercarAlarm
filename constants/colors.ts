const colors = {
  light: {
    text: "#0F1B35",
    tint: "#3D8EFF",

    background: "#F0F4FF",
    foreground: "#0F1B35",

    card: "#FFFFFF",
    cardForeground: "#0F1B35",

    cardSecondary: "#F5F8FF",

    primary: "#3D8EFF",
    primaryForeground: "#ffffff",

    secondary: "#EEF2FF",
    secondaryForeground: "#0F1B35",

    muted: "#EEF2FF",
    mutedForeground: "#6B7A9A",

    accent: "#9B5DE5",
    accentForeground: "#ffffff",

    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    border: "#DDE4F8",
    input: "#FFFFFF",

    sectionHeader: "#6B7A9A",

    glassBorder: "#DDE4F8",
    glassLight: "rgba(255,255,255,0.90)",
    glowBlue: "rgba(61,142,255,0.20)",
    glowPurple: "rgba(155,93,229,0.20)",

    gradientColors: ["#F0F4FF", "#F5F0FF"] as string[],
    blobBlue: "rgba(61,142,255,0.10)",
    blobPurple: "rgba(155,93,229,0.08)",
  },

  dark: {
    text: "#E8EEFF",
    tint: "#5EA3FF",

    background: "#0B1120",
    foreground: "#E8EEFF",

    card: "#131D38",
    cardForeground: "#E8EEFF",

    cardSecondary: "#172040",

    primary: "#5EA3FF",
    primaryForeground: "#0B1120",

    secondary: "#1A2540",
    secondaryForeground: "#E8EEFF",

    muted: "#1A2540",
    mutedForeground: "#8B98B8",

    accent: "#B07FFF",
    accentForeground: "#ffffff",

    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    border: "#1E2D52",
    input: "#1A2540",

    sectionHeader: "#8B98B8",

    glassBorder: "#1E2D52",
    glassLight: "rgba(255,255,255,0.05)",
    glowBlue: "rgba(94,163,255,0.25)",
    glowPurple: "rgba(176,127,255,0.25)",

    gradientColors: ["#0B1120", "#111830"] as string[],
    blobBlue: "rgba(61,142,255,0.14)",
    blobPurple: "rgba(155,93,229,0.12)",
  },

  radius: 16,
} as const;

export default colors;
