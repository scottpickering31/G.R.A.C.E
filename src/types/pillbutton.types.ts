import { LucideIcon } from "lucide-react-native";
import { TextStyle, ViewStyle } from "react-native";

export type PillButtonProps = {
  label: string;
  subtitle?: string;
  onPress?: () => void;

  // Icons
  Icon?: LucideIcon;
  iconSize?: number;
  iconColor?: string;
  iconBgColor?: string;
  showIconChip?: boolean;

  RightIcon?: LucideIcon;
  rightIconSize?: number;
  rightIconColor?: string;

  // Styling
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  textContainerStyle?: ViewStyle;

  elevationActive?: boolean;
  borderActive?: boolean;

  // Text wrapping control
  labelNumberOfLines?: number; // default 1
  subtitleNumberOfLines?: number; // default undefined (wrap)
};
