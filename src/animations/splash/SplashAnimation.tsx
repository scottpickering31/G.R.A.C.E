import Layer from "@/animations/splash/layer";
import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

type SplashAnimationProps = {
  onDone?: () => void;
};

export default function SplashAnimation({ onDone }: SplashAnimationProps) {
  const { width } = useWindowDimensions();

  const offLeft = -width;
  const offRight = width;

  return (
    <View style={styles.stage} pointerEvents="none">
      <Layer
        source={require("@/assets/images/left-clouds.png")}
        fromX={offLeft}
        delayMs={0}
        durationMs={700}
        zIndex={1}
      />
      <Layer
        source={require("@/assets/images/right-clouds.png")}
        fromX={offRight}
        delayMs={100}
        durationMs={700}
        zIndex={2}
      />

      <Layer
        source={require("@/assets/images/central-clouds.png")}
        fromX={0}
        toX={0}
        delayMs={250}
        durationMs={650}
        zIndex={3}
        opacityTo={1}
      />

      <Layer
        source={require("@/assets/images/left-forest.png")}
        fromX={offLeft}
        delayMs={650}
        durationMs={800}
        zIndex={4}
      />
      <Layer
        source={require("@/assets/images/right-forest.png")}
        fromX={offRight}
        delayMs={750}
        durationMs={800}
        zIndex={5}
        isLast
        onDone={onDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFillObject,
  },
});
