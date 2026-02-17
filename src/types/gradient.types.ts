import { ColorValue } from "react-native";

export type GradientProps = {
  // Gradient support
  gradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
};
