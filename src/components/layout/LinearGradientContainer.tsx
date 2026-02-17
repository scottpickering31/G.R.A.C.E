import type { GradientProps } from "@/src/types/gradient.types";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";

type Props = GradientProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function LinearGradientStyle({
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 0 },
  style,
  children,
}: Props) {
  if (!gradientColors || gradientColors.length < 2) return null;

  return (
    <LinearGradient
      colors={gradientColors}
      start={gradientStart}
      end={gradientEnd}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
