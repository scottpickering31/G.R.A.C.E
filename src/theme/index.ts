// src/theme/index.ts
import {
  borders,
  colors,
  elevation,
  radius,
  spacing,
  typography,
} from "./tokens";

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  borders,
  elevation,

  surface: {
    screen: colors.bg.skyLight,
    card: colors.bg.card,
    section: colors.bg.section,
  },
} as const;

export type Theme = typeof theme;
