import { colors } from "@/styles/shared-styles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import AvatarImage from "../profile/AvatarImage";

type ListBlockProps = {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  iconBgColor?: string;
  iconColor?: string;

  title: string;
  subtitle?: string;

  rightText?: string;
  rightTextContainer?: ViewStyle;
  rightTextStyles?: TextStyle;

  showChevron?: boolean; // optional override
  onPress?: () => void; // if undefined => not pressable
  showDivider?: boolean;

  style?: ViewStyle;
};

export default function ListBlock({
  iconName,
  iconBgColor = "rgba(74, 144, 226, 0.18)",
  iconColor = colors.brand.primary,

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
  const Container: any = isPressable ? Pressable : View;

  // Default behavior: show chevron only when pressable
  const shouldShowChevron = showChevron ?? isPressable;

  return (
    <View style={style}>
      <Container
        {...(isPressable ? { onPress } : {})}
        style={({ pressed }: any) => [
          styles.row,
          isPressable && pressed && styles.pressed,
        ]}
      >
        <AvatarImage
          size={34}
          iconName={iconName}
          innerBgColor={iconBgColor}
          iconColor={iconColor}
        />

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={[styles.rightCol, rightTextContainer]}>
          {!!rightText && (
            <Text style={[styles.rightText, rightTextStyles]} numberOfLines={1}>
              {rightText}
            </Text>
          )}

          {shouldShowChevron && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(31,41,55,0.45)"
              style={styles.chevron}
            />
          )}
        </View>
      </Container>

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
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  rightCol: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  rightText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  chevron: {
    marginLeft: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(31,41,55,0.08)",
    marginLeft: 14 + 34 + 12,
  },
});
