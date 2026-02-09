import { useHeaderHeight } from "@react-navigation/elements";
import React from "react";
import { ImageBackground, StyleSheet, View, ViewStyle } from "react-native";

export default function Screen({
  children,
  contentStyle,
}: {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}) {
  const headerHeight = useHeaderHeight(); // height of the current header

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("@/assets/images/clouds.png")}
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
