import React, { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

type SectionProps = PropsWithChildren<object>;

export default function Section({ children }: SectionProps) {
  return (
    <View style={styles.shell}>
      {/* base background (does NOT affect children) */}
      <View style={styles.baseBg} />

      {/* top “glass” tint so clouds show through */}
      <View style={styles.topTint} />

      {/* content stays fully opaque */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const R_TOP = 24;
const R_BOTTOM = 50;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    marginHorizontal: 10,
    borderTopLeftRadius: R_TOP,
    borderTopRightRadius: R_TOP,
    borderBottomLeftRadius: R_BOTTOM,
    borderBottomRightRadius: R_BOTTOM,
    overflow: "hidden", // IMPORTANT: clip the tint to rounded corners
    position: "relative",

    // shadow / elevation on the container
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2.5,
  },

  // the main background for the whole section
  baseBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.32)", // your colors.bg.section but translucent
  },

  // only affects the TOP portion visually
  topTint: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "35%", // tweak: top half-ish
  },

  content: {
    flex: 1,
    padding: 10,
  },
});
