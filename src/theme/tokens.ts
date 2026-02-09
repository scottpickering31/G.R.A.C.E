// src/theme/tokens.ts
export const colors = {
  bg: {
    skyLight: "#F5FAFF",
    skyMid: "#EAF3FB",
    skySoft: "#DDECF7",
    section: "#FBFBFF",
    card: "#FFFFFF",
    info: "#EAF4FB",
    success: "#ECF7F1",
    warning: "#FFF4E0",
    danger: "#FDECEC",
  },

  brand: {
    primary: "#4A90E2",
    soft: "#DCEBFA",
    muted: "#9DBFE8",
    dark: "#2F6FB2",
  },

  semantic: {
    info: "#6BAEDC",
    success: "#7EC8A0",
    warning: "#F5C16C",
    danger: "#E96B6B",
  },

  emergency: {
    primary: "#E95A5A",
    dark: "#C84444",
    glow: "#FFDADA",
  },

  text: {
    primary: "#1F2D3D",
    secondary: "#5F6F82",
    muted: "#9AA7B6",
  },

  ui: {
    divider: "#E6EDF3",
    border: "#F0F4F8",
  },
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 40,
  10: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: "NunitoSans_400Regular",
    semibold: "NunitoSans_600SemiBold",
    bold: "NunitoSans_700Bold",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    "2xl": 28,
    "3xl": 34,
  },
  lineHeight: {
    sm: 18,
    md: 22,
    lg: 26,
    xl: 30,
  },
  letterSpacing: {
    normal: 0,
    wide: 0.5,
    brand: 6,
  },
} as const;

// Keep your card tokens, but make them “semantic”
export const elevation = {
  card: {
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    // Android shadow
    elevation: 6,
  },
} as const;

export const borders = {
  subtle: {
    borderWidth: 0.5,
    borderColor: "rgba(17, 24, 39, 0.06)",
  },
} as const;
