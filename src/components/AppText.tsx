import { theme } from "@/theme";
import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

type Props = TextProps & {
  weight?: "regular" | "semibold" | "bold";
};

export default function AppText({
  style,
  weight = "regular",
  ...props
}: Props) {
  const fontFamily =
    weight === "bold"
      ? theme.typography.fontFamily.bold
      : weight === "semibold"
        ? theme.typography.fontFamily.semibold
        : theme.typography.fontFamily.regular;

  return <Text {...props} style={[styles.base, { fontFamily }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    color: theme.colors.text.primary,
  },
});
