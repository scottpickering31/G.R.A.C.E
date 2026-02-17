import { LinearGradientStyle } from "@/src/components/layout/LinearGradientContainer";
import { GradientProps } from "@/src/types/gradient.types";
import { PillButtonProps } from "@/src/types/pillbutton.types";
import { cardStyles } from "@/styles/shared-styles";
import React from "react";
import { Platform, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import AppText from "../AppText";

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
  rightIconSize,
  rightIconColor = "rgba(31,41,55,0.45)",

  disabled,
  style,
  textStyle,
  subtitleStyle,
  textContainerStyle,

  elevationActive = true,
  borderActive = true,
  gradientStart,
  gradientEnd,
  gradientColors,
  labelNumberOfLines = 1,
  subtitleNumberOfLines,
}: PillButtonProps & GradientProps) {
  const hasGradient = !!(gradientColors && gradientColors.length >= 2);

  const containerStyle: ViewStyle = [
    styles.pill,
    borderActive && !hasGradient ? cardStyles.border : null,
    elevationActive
      ? Platform.OS === "android"
        ? styles.androidElevation
        : cardStyles.shadow
      : null,
    disabled ? styles.disabled : null,
    style,
  ].filter(Boolean) as any;

  const content = (
    <>
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

      {/* IMPORTANT: flexShrink enables wrapping inside row layouts */}
      <View style={[styles.textContainer, textContainerStyle]}>
        <AppText
          style={[styles.label, textStyle]}
          numberOfLines={labelNumberOfLines}
        >
          {label}
        </AppText>

        {subtitle ? (
          <AppText
            style={[styles.subtitle, subtitleStyle]}
            numberOfLines={subtitleNumberOfLines}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {RightIcon ? (
        <RightIcon
          size={rightIconSize ?? 18}
          color={disabled ? "rgba(31,41,55,0.25)" : rightIconColor}
        />
      ) : null}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [pressed && !disabled ? styles.pressed : null]}
    >
      {hasGradient ? (
        <LinearGradientStyle
          gradientColors={gradientColors}
          gradientStart={gradientStart}
          gradientEnd={gradientEnd}
          style={containerStyle} // ✅ apply pill layout to gradient too
        >
          {content}
        </LinearGradientStyle>
      ) : (
        <View style={containerStyle}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
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
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  textContainer: {
    flex: 1,
    flexShrink: 1,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "400",
    color: "#1F2937",
    opacity: 0.8,
  },

  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  disabled: {
    opacity: 0.55,
  },
});
