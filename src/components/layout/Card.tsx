import { cardStyles, spacing } from "@/styles/shared-styles";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  elevationActive?: boolean;
  borderActive?: boolean;
  style?: ViewStyle;

  padding: keyof typeof spacing;
}

export default function Card({
  children,
  elevationActive = false,
  borderActive = true,
  padding = "md",
  style,
}: CardProps) {
  return (
    <View
      style={[
        styles.container,
        borderActive && cardStyles.border,
        spacing[padding],
        style,
        elevationActive &&
          (Platform.OS === "android" ? { elevation: 4 } : cardStyles.shadow),
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },
});
