import Card from "@/components/layout/Card";
import Section from "@/components/layout/Section";
import Screen from "@/src/components/layout/Screen";
import React from "react";
import { StyleSheet, View } from "react-native";
import SkeletonBlock from "./SkeletonBlock";

type Props = {
  screenBackground?: number;
  showHeader?: boolean;
  sectionCount?: number;
  rowCount?: number;
};

export default function PageSkeleton({
  screenBackground = require("@/assets/images/clouds.png"),
  showHeader = true,
  sectionCount = 2,
  rowCount = 3,
}: Props) {
  return (
    <Screen screenBackground={screenBackground} useSafeArea={false}>
      <Section pullToRefreshEnabled={false}>
        {showHeader ? (
          <View style={styles.headerRow}>
            <View style={styles.headerAvatar} />
            <View style={styles.headerText}>
              <SkeletonBlock width={140} height={18} radius={8} />
              <View style={{ height: 8 }} />
              <SkeletonBlock width={96} height={12} radius={8} />
            </View>
          </View>
        ) : null}

        <Card
          padding="md"
          borderActive={true}
          elevationActive={true}
          style={styles.heroCard}
        >
          <SkeletonBlock width="58%" height={20} />
          <View style={{ height: 10 }} />
          <SkeletonBlock width="82%" height={14} />
          <View style={{ height: 8 }} />
          <SkeletonBlock width="66%" height={14} />
        </Card>

        {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
          <Card
            key={`section-${sectionIndex}`}
            padding="md"
            borderActive={true}
            elevationActive={true}
          >
            <View style={styles.sectionHeader}>
              <SkeletonBlock width={140} height={16} />
              <SkeletonBlock width={72} height={24} radius={999} />
            </View>

            {Array.from({ length: rowCount }).map((__, rowIndex) => (
              <View key={`row-${sectionIndex}-${rowIndex}`} style={styles.rowCard}>
                <SkeletonBlock width="52%" height={14} />
                <View style={{ height: 8 }} />
                <SkeletonBlock width="78%" height={12} />
                <View style={{ height: 6 }} />
                <SkeletonBlock width="46%" height={12} />
              </View>
            ))}
          </Card>
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  headerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.14)",
  },
  headerText: {
    flex: 1,
    alignItems: "flex-start",
  },
  heroCard: {
    backgroundColor: "rgba(234,243,251,0.85)",
    borderColor: "rgba(74,144,226,0.18)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  rowCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.08)",
    backgroundColor: "rgba(255,255,255,0.82)",
    padding: 12,
  },
});
