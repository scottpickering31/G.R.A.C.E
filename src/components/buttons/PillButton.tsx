import { cardStyles } from "@/styles/shared-styles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

type PillButtonProps = {
  label: string;
  onPress?: () => void;

  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  iconSize?: number;
  iconColor?: string;
  iconBgColor?: string;
  showIconChip?: boolean;

  rightIconName?: React.ComponentProps<typeof Ionicons>["name"];
  rightIconColor?: string;

  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;

  // optional toggle if you want
  elevationActive?: boolean;
  borderActive?: boolean;
};

export default function PillButton({
  label,
  onPress,
  iconName = "folder-outline",
  iconSize,
  iconColor = "#3B82F6",
  iconBgColor = "rgba(59, 130, 246, 0.12)",
  showIconChip = true,
  rightIconName = "chevron-forward",
  rightIconColor = "rgba(31,41,55,0.45)",
  disabled,
  style,
  textStyle,

  elevationActive = true,
  borderActive = true,
}: PillButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pill,

        // border
        borderActive && cardStyles.border,

        // shadow / elevation
        elevationActive &&
          (Platform.OS === "android"
            ? styles.androidElevation
            : cardStyles.shadow),

        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {iconName ? (
        showIconChip ? (
          <View style={[styles.leftIconWrap, { backgroundColor: iconBgColor }]}>
            <Ionicons name={iconName} size={iconSize} color={iconColor} />
          </View>
        ) : (
          <Ionicons name={iconName} size={iconSize} color={iconColor} />
        )
      ) : null}

      <Text style={[styles.label, textStyle]} numberOfLines={1}>
        {label}
      </Text>

      <Ionicons
        name={rightIconName}
        size={18}
        color={disabled ? "rgba(31,41,55,0.25)" : rightIconColor}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",

    // important for Android elevation to look right
    ...(Platform.OS === "android" ? { backgroundColor: "#fff" } : null),
  },
  androidElevation: {
    elevation: 4,
  },
  leftIconWrap: {
    width: 25,
    height: 25,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#1F2937",
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});
