import { useHeaderHeight } from "@react-navigation/elements";
import React from "react";
import {
  ImageBackground,
  ImageSourcePropType,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

interface Screenprops {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  screenBackground?: ImageSourcePropType;
}

export default function Screen({
  children,
  contentStyle,
  screenBackground,
}: Screenprops) {
  const headerHeight = useHeaderHeight();

  return (
    <View style={styles.root}>
      <ImageBackground
        source={screenBackground}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* optional fade/overlay */}
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
    </View>
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
