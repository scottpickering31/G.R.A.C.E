import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

type Props = {
  width: number | `${number}%`;
  height: number;
  radius?: number;
};

export default function SkeletonBlock({
  width,
  height,
  radius = 10,
}: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 140],
  });

  return (
    <View
      style={[
        styles.blockBase,
        {
          width,
          height,
          borderRadius: radius,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blockBase: {
    overflow: "hidden",
    backgroundColor: "rgba(74,144,226,0.10)",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 90,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
});
