// src/theme/styles.ts
import { theme } from "./index";

export const makeCard = () => ({
  backgroundColor: theme.colors.bg.card,
  borderRadius: theme.radius.lg,
  ...theme.borders.subtle,
  ...theme.elevation.card,
});

export const textStyles = {
  h1: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize["3xl"],
    lineHeight: theme.typography.lineHeight.xl,
    color: theme.colors.text.primary,
  },
  h2: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize["2xl"],
    lineHeight: theme.typography.lineHeight.xl,
    color: theme.colors.text.primary,
  },
  body: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    color: theme.colors.text.primary,
  },
  caption: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    color: theme.colors.text.secondary,
  },
} as const;
