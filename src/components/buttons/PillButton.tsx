import { cardStyles } from "@/styles/shared-styles";
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import AppText from "../AppText";

type PillButtonProps = {
  label: string;
  subtitle?: string;
  onPress?: () => void;
  labelWrap?: ViewStyle;
  Icon?: LucideIcon;
  iconSize?: number;
  iconColor?: string;
  iconBgColor?: string;
  showIconChip?: boolean;

  RightIcon?: LucideIcon;
  rightIconColor?: string;

  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;

  elevationActive?: boolean;
  borderActive?: boolean;
};

export default function PillButton({
  label,
  subtitle,
  onPress,
  Icon,
  iconSize,
  iconColor = "#3B82F6",
  iconBgColor = "rgba(59, 130, 246, 0.12)",
  showIconChip = true,
  RightIcon,
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
        borderActive && cardStyles.border,
        elevationActive &&
          (Platform.OS === "android"
            ? styles.androidElevation
            : cardStyles.shadow),
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {Icon &&
        (showIconChip ? (
          <View style={[styles.leftIconWrap, { backgroundColor: iconBgColor }]}>
            <Icon
              size={iconSize ?? 18}
              color={disabled ? "rgba(31,41,55,0.25)" : iconColor}
            />
          </View>
        ) : (
          <Icon
            size={iconSize ?? 18}
            color={disabled ? "rgba(31,41,55,0.25)" : iconColor}
          />
        ))}
      <View>
        <AppText style={[styles.label, textStyle]} numberOfLines={1}>
          {label}
        </AppText>

        {subtitle && (
          <AppText style={[styles.label, { fontSize: 12 }]} numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>

      {RightIcon && (
        <RightIcon
          size={18}
          color={disabled ? "rgba(31,41,55,0.25)" : rightIconColor}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 7,
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
