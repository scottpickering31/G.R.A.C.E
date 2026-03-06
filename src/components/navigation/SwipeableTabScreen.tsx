import { useRouter } from "expo-router";
import { ReactNode, useMemo } from "react";
import { PanResponder, PanResponderGestureState, View } from "react-native";

const SWIPE_THRESHOLD = 64;
const VELOCITY_THRESHOLD = 0.28;

const TAB_ROUTES = [
  "/(tabs)",
  "/(tabs)/medications-treatments",
  "/(tabs)/appointments",
  "/(tabs)/stock",
  "/(tabs)/more",
] as const;

type TabRoute = (typeof TAB_ROUTES)[number];

type SwipeableTabScreenProps = {
  activeRoute: TabRoute;
  children: ReactNode;
};

function shouldHandleSwipe(gestureState: PanResponderGestureState) {
  const absDx = Math.abs(gestureState.dx);
  const absDy = Math.abs(gestureState.dy);
  return absDx > 12 && absDx > absDy * 1.2;
}

export default function SwipeableTabScreen({
  activeRoute,
  children,
}: SwipeableTabScreenProps) {
  const router = useRouter();

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          shouldHandleSwipe(gestureState),
        onPanResponderRelease: (_, gestureState) => {
          const index = TAB_ROUTES.indexOf(activeRoute);
          if (index === -1) return;

          const isSwipeLeft =
            gestureState.dx <= -SWIPE_THRESHOLD ||
            gestureState.vx <= -VELOCITY_THRESHOLD;
          const isSwipeRight =
            gestureState.dx >= SWIPE_THRESHOLD ||
            gestureState.vx >= VELOCITY_THRESHOLD;

          if (isSwipeLeft && index < TAB_ROUTES.length - 1) {
            router.replace(TAB_ROUTES[index + 1]);
          } else if (isSwipeRight && index > 0) {
            router.replace(TAB_ROUTES[index - 1]);
          }
        },
      }),
    [activeRoute, router],
  );

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
