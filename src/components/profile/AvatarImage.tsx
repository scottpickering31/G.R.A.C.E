import React from "react";
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

type IconComponentType = React.ComponentType<{
  size?: number;
  color?: string;
}>;

type AvatarImageProps = {
  size?: number;
  onPress?: () => void;

  outerBgColor?: string;
  innerBgColor?: string;

  // choose ONE: image OR icon
  source: ImageSourcePropType | null;

  Icon?: IconComponentType;
  iconSize?: number;
  iconColor?: string;
  initials?: string;

  outerStyle?: ViewStyle;
  innerStyle?: ViewStyle;
  imageStyle?: ImageStyle;

  elevationActive?: boolean;
};

export default function AvatarImage({
  size = 60,
  outerBgColor = "#fff",
  innerBgColor = "#fff",
  onPress,
  source,
  Icon,
  iconSize,
  iconColor = "#4A90E2",
  initials,
  outerStyle,
  innerStyle,
  imageStyle,
  elevationActive = true,
}: AvatarImageProps) {
  const outerSize = size + 7;

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.outer,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            backgroundColor: outerBgColor,
          },
          elevationActive && styles.shadow,
          outerStyle,
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: innerBgColor,
            },
            innerStyle,
          ]}
        >
          {source ? (
            <Image
              source={source}
              style={[styles.image, imageStyle]}
              resizeMode="cover"
            />
          ) : Icon ? (
            <Icon
              size={iconSize ?? Math.round(size * 0.55)}
              color={iconColor}
            />
          ) : initials ? (
            <Text style={[styles.initials, { fontSize: Math.round(size * 0.34) }]}>
              {initials}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: "#1F2D3D",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  shadow: {
    // iOS
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    // Android
    elevation: 4,
  },
});
