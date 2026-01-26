// Section.tsx
import React, { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

type SectionProps = PropsWithChildren<{
  header?: ReactNode; // fixed content at the top
  scrollEnabled?: boolean;
}>;

export default function Section({
  header,
  children,
  scrollEnabled = true,
}: SectionProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.baseBg} />
      <View style={styles.topTint} />

      {/* Fixed header area (doesn't scroll) */}
      {!!header && <View style={styles.fixedHeader}>{header}</View>}

      {/* Scrollable content area */}
      {scrollEnabled ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.scrollContent}>{children}</View>
      )}
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
    overflow: "hidden",
    position: "relative",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },

  baseBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },

  topTint: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "35%",
    backgroundColor: "rgba(245,250,255,0.05)",
  },

  fixedHeader: {
    padding: 10,
    paddingBottom: 6,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 10,
    paddingTop: 13, // because fixedHeader already has padding
    paddingBottom: 90, // IMPORTANT: so content doesn't hide behind the tab bar
  },
});
