import Card from "@/src/components/layout/Card";
import Screen from "@/src/components/layout/Screen";
import Section from "@/src/components/layout/Section";
import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import SkeletonBlock from "./SkeletonBlock";

export default function DashboardSkeleton() {
  const { height } = useWindowDimensions();

  return (
    <Screen
      screenBackground={require("@/assets/images/clouds.png")}
      useSafeArea={false}
    >
      <Section pullToRefreshEnabled={false}>
        <View
          style={[styles.content, { minHeight: Math.max(height * 0.82, 620) }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerAvatar} />
            <View style={styles.headerText}>
              <SkeletonBlock width={158} height={18} radius={8} />
              <View style={styles.gapXs} />
              <SkeletonBlock width={102} height={12} radius={8} />
            </View>
          </View>

          <Card
            elevationActive={true}
            borderActive={true}
            padding="md"
            style={styles.heroCard}
          >
            <SkeletonBlock width="62%" height={22} />
            <View style={styles.gapSm} />
            <SkeletonBlock width="84%" height={14} />
            <View style={styles.gapXs} />
            <SkeletonBlock width={140} height={30} radius={999} />
          </Card>

          <Card elevationActive={true} borderActive={true} padding="md">
            <View style={styles.sectionHeader}>
              <SkeletonBlock width={136} height={18} />
              <SkeletonBlock width={88} height={30} radius={999} />
            </View>

            <View style={styles.filterRow}>
              <SkeletonBlock width={78} height={28} radius={999} />
              <SkeletonBlock width={86} height={28} radius={999} />
              <SkeletonBlock width={76} height={28} radius={999} />
            </View>

            {Array.from({ length: 4 }).map((_, index) => (
              <View
                key={`dashboard-skeleton-row-${index}`}
                style={[styles.taskRow, index === 3 && styles.taskRowLast]}
              >
                <View style={styles.taskIcon} />
                <View style={styles.taskText}>
                  <SkeletonBlock width="56%" height={14} />
                  <View style={styles.gapXs} />
                  <SkeletonBlock width="82%" height={12} />
                </View>
                <SkeletonBlock width={88} height={28} radius={999} />
              </View>
            ))}
          </Card>

          <View style={styles.bottomSpacer} />

          <Card
            elevationActive={true}
            borderActive={true}
            padding="md"
            style={styles.emergencyCard}
          >
            <SkeletonBlock width="100%" height={54} radius={999} />
          </Card>
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  headerAvatar: {
    width: 75,
    height: 75,
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
    gap: 10,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(31,45,61,0.08)",
  },
  taskRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  taskIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(74, 144, 226, 0.16)",
  },
  taskText: {
    flex: 1,
  },
  bottomSpacer: {
    flex: 1,
    minHeight: 16,
  },
  emergencyCard: {
    borderColor: "rgba(30,58,138,0.16)",
    marginBottom: 18,
  },
  gapXs: {
    height: 8,
  },
  gapSm: {
    height: 10,
  },
});
