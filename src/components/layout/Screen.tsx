import { useHeaderHeight } from "@react-navigation/elements";
import React from "react";
import {
  ImageBackground,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  screenBackground?: ImageSourcePropType;
  useSafeArea?: boolean;
  rootStyle?: StyleProp<ViewStyle>;
};

export default function Screen({
  children,
  contentStyle,
  screenBackground,
  useSafeArea = false,
  rootStyle,
}: ScreenProps) {
  const headerHeight = useHeaderHeight();

  const Root = useSafeArea ? SafeAreaView : View;

  return (
    <Root style={[styles.root, rootStyle]}>
      <ImageBackground
        source={screenBackground}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.fade} />

        <View
          style={[
            styles.content,
            { paddingTop: headerHeight - 10 },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </ImageBackground>
    </Root>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5FAFF" },
  bg: { flex: 1 },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 120,
    backgroundColor: "rgba(245,250,255,0)",
  },
  content: { flex: 1 },
});
