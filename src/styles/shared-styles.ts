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

export const cardStyles = {
  border: {
    borderWidth: 0.5,
    borderColor: "rgba(17, 24, 39, 0.06)",
  },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
} as const;

export const spacing = {
  none: {},
  sm: { padding: 8 },
  md: { padding: 14 },
  lg: { padding: 20 },

  // if you like asymmetric padding:
  cardInset: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
} as const;
