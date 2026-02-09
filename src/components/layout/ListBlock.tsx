import { theme } from "@/src/theme";
import { colors } from "@/styles/shared-styles";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import AppText from "../AppText";
import AvatarImage from "../profile/AvatarImage";

type ListBlockProps = {
  Icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  iconSize?: number;

  title: string;
  subtitle?: string;

  rightText?: string;
  rightTextContainer?: ViewStyle;
  rightTextStyles?: TextStyle;

  showChevron?: boolean;
  onPress?: () => void;
  showDivider?: boolean;

  style?: ViewStyle;
};

export default function ListBlock({
  Icon,
  iconBgColor = "rgba(74, 144, 226, 0.18)",
  iconColor = colors.brand.primary,
  iconSize,

  title,
  subtitle,

  rightText,
  rightTextStyles,
  rightTextContainer,

  showChevron,
  onPress,
  showDivider = true,
  style,
}: ListBlockProps) {
  const isPressable = !!onPress;
  const shouldShowChevron = showChevron ?? isPressable;

  return (
    <View style={style}>
      <Pressable
        disabled={!isPressable}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          isPressable && pressed && styles.pressed,
        ]}
      >
        <AvatarImage
          size={34}
          source={null}
          Icon={Icon}
          iconSize={iconSize}
          innerBgColor={iconBgColor}
          iconColor={iconColor}
          elevationActive={false}
        />

        <View style={styles.textCol}>
          <AppText style={styles.title} numberOfLines={1}>
            {title}
          </AppText>

          {!!subtitle && (
            <AppText style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </AppText>
          )}
        </View>

        <View style={[styles.rightCol, rightTextContainer]}>
          {!!rightText && (
            <AppText
              style={[styles.rightText, rightTextStyles]}
              numberOfLines={1}
            >
              {rightText}
            </AppText>
          )}

          {shouldShowChevron && <ChevronRight size={20} />}
        </View>
      </Pressable>

      {showDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  textCol: {
    flex: 1,
    marginLeft: 8,
    gap: 2,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.secondary,
  },
  rightCol: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    borderRadius: 45,
  },
  rightText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(31,41,55,0.05)",
  },
});
