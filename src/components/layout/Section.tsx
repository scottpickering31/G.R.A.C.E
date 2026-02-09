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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.scrollContent}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },

  baseBg: {
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

  scrollContent: {
    padding: 10,
    paddingTop: 10,
    paddingBottom: 90,
  },
});
