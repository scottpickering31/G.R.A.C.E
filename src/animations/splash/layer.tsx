import React, { useEffect } from "react";
import { ImageSourcePropType, StyleSheet } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type LayerProps = {
  source: ImageSourcePropType;
  fromX: number;
  toX?: number;
  delayMs: number;
  durationMs: number;
  zIndex: number;
  opacityTo?: number;
  isLast?: boolean;
  onDone?: () => void;
};

export default function Layer({
  source,
  fromX,
  toX = 0,
  delayMs,
  durationMs,
  zIndex,
  opacityTo = 1,
  isLast = false,
  onDone,
}: LayerProps) {
  const x = useSharedValue(fromX);
  const opacity = useSharedValue(0);

  useEffect(() => {
    x.value = withDelay(
      delayMs,
      withTiming(
        toX,
        {
          duration: durationMs,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          "worklet";
          if (finished && isLast && onDone) {
            scheduleOnRN(onDone);
          }
        },
      ),
    );

    opacity.value = withDelay(
      delayMs,
      withTiming(opacityTo, {
        duration: Math.min(400, durationMs),
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delayMs, durationMs, toX, opacityTo, isLast, onDone, x, opacity]);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Image
      source={source}
      resizeMode="cover"
      style={[StyleSheet.absoluteFillObject, { zIndex }, rStyle]}
    />
  );
}
