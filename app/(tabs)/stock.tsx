import Card from "@/components/layout/Card";
import Section from "@/components/layout/Section";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AppText from "@/src/components/AppText";
import Screen from "@/src/components/layout/Screen";
import SwipeableTabScreen from "@/src/components/navigation/SwipeableTabScreen";
import { theme } from "@/src/theme";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleCheckBig,
  ClipboardPlus,
  PackageOpen,
  Pill,
  Syringe,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type StockCategory = "medication" | "supply";
type StockFilter = "all" | "critical" | StockCategory;

type StockItem = {
  id: string;
  name: string;
  category: StockCategory;
  quantity: number;
  capacity: number;
  unit: string;
  reorderPoint: number;
  expiresAt?: string;
  lastUpdated: string;
};

const STOCK_ITEMS: StockItem[] = [
  {
    id: "st-1",
    name: "Phenobarbital",
    category: "medication",
    quantity: 48,
    capacity: 200,
    unit: "ml",
    reorderPoint: 60,
    expiresAt: "2026-08-14",
    lastUpdated: "Today 08:42",
  },
  {
    id: "st-2",
    name: "Levetiracetam",
    category: "medication",
    quantity: 16,
    capacity: 90,
    unit: "tablets",
    reorderPoint: 20,
    expiresAt: "2026-07-06",
    lastUpdated: "Today 10:10",
  },
  {
    id: "st-3",
    name: "Syringes 10 ml",
    category: "supply",
    quantity: 6,
    capacity: 40,
    unit: "units",
    reorderPoint: 10,
    lastUpdated: "Yesterday 16:32",
  },
  {
    id: "st-4",
    name: "Gauze Pads",
    category: "supply",
    quantity: 80,
    capacity: 100,
    unit: "packs",
    reorderPoint: 25,
    lastUpdated: "Today 09:17",
  },
  {
    id: "st-5",
    name: "Vitamin D3",
    category: "medication",
    quantity: 9,
    capacity: 60,
    unit: "capsules",
    reorderPoint: 12,
    expiresAt: "2026-04-02",
    lastUpdated: "Today 07:55",
  },
];

function stockLevel(item: StockItem) {
  if (item.quantity <= 0) return "empty" as const;
  if (item.quantity <= item.reorderPoint) return "critical" as const;
  if (item.quantity <= item.reorderPoint * 1.5) return "watch" as const;
  return "good" as const;
}

function fillPercent(item: StockItem) {
  if (item.capacity <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((item.quantity / item.capacity) * 100)));
}

export default function Stock() {
  const [filter, setFilter] = useState<StockFilter>("all");
  const [showOnlyExpiring, setShowOnlyExpiring] = useState(false);

  const summary = useMemo(() => {
    const critical = STOCK_ITEMS.filter((item) => stockLevel(item) === "critical" || stockLevel(item) === "empty");
    const watch = STOCK_ITEMS.filter((item) => stockLevel(item) === "watch");
    const medications = STOCK_ITEMS.filter((item) => item.category === "medication");
    const supplies = STOCK_ITEMS.filter((item) => item.category === "supply");
    return { critical: critical.length, watch: watch.length, medications: medications.length, supplies: supplies.length };
  }, []);

  const expiringSoon = useMemo(
    () =>
      STOCK_ITEMS.filter((item) => item.expiresAt)
        .sort((a, b) => (a.expiresAt ?? "").localeCompare(b.expiresAt ?? ""))
        .slice(0, 3),
    [],
  );

  const filteredItems = useMemo(() => {
    return STOCK_ITEMS.filter((item) => {
      if (showOnlyExpiring && !item.expiresAt) return false;
      if (filter === "all") return true;
      if (filter === "critical") {
        const level = stockLevel(item);
        return level === "critical" || level === "empty";
      }
      return item.category === filter;
    });
  }, [filter, showOnlyExpiring]);

  return (
    <SwipeableTabScreen activeRoute="/(tabs)/stock">
      <Screen
        screenBackground={require("@/assets/images/clouds.png")}
        useSafeArea={false}
      >
        <Section>
          <View style={styles.headerRow}>
            <ProfileHeader style={{ width: "58%" }} />
            <Pressable style={styles.addEventBtn}>
              <ClipboardPlus size={16} color={theme.colors.brand.dark} />
              <AppText weight="semibold" style={styles.addEventText}>
                Log Refill
              </AppText>
            </Pressable>
          </View>

          <Card padding="md" borderActive={true} elevationActive={true}>
            <AppText weight="semibold" style={styles.title}>
              Stock Control
            </AppText>
            <AppText style={styles.subtitle}>
              Track medicines and supplies, catch low inventory early, and stay
              ahead of upcoming expiry dates.
            </AppText>
          </Card>

          <Card padding="md" borderActive={true} elevationActive={true}>
            <View style={styles.metricsRow}>
              <View style={styles.metricTile}>
                <AlertTriangle size={16} color="#D14343" />
                <AppText weight="bold" style={styles.metricValue}>
                  {summary.critical}
                </AppText>
                <AppText style={styles.metricLabel}>Critical</AppText>
              </View>
              <View style={styles.metricTile}>
                <CalendarClock size={16} color="#B7791F" />
                <AppText weight="bold" style={styles.metricValue}>
                  {summary.watch}
                </AppText>
                <AppText style={styles.metricLabel}>Watchlist</AppText>
              </View>
              <View style={styles.metricTile}>
                <Pill size={16} color={theme.colors.brand.primary} />
                <AppText weight="bold" style={styles.metricValue}>
                  {summary.medications}
                </AppText>
                <AppText style={styles.metricLabel}>Meds</AppText>
              </View>
              <View style={styles.metricTile}>
                <Syringe size={16} color="#2F855A" />
                <AppText weight="bold" style={styles.metricValue}>
                  {summary.supplies}
                </AppText>
                <AppText style={styles.metricLabel}>Supplies</AppText>
              </View>
            </View>
          </Card>

          <Card padding="md" borderActive={true} elevationActive={true}>
            <View style={styles.sectionHeader}>
              <AppText weight="semibold">Low Stock Priority</AppText>
              <Pressable style={styles.miniAction}>
                <AppText style={styles.miniActionText}>View All</AppText>
              </Pressable>
            </View>

            {STOCK_ITEMS.filter((item) => {
              const level = stockLevel(item);
              return level === "critical" || level === "empty";
            }).map((item) => (
              <View key={item.id} style={styles.priorityRow}>
                <View style={styles.priorityIconWrap}>
                  <PackageOpen size={16} color="#D14343" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="semibold" style={styles.rowTitle}>
                    {item.name}
                  </AppText>
                  <AppText style={styles.rowMeta}>
                    {item.quantity} / {item.capacity} {item.unit} • Reorder at{" "}
                    {item.reorderPoint} {item.unit}
                  </AppText>
                </View>
                <View style={styles.badgeCritical}>
                  <AppText style={styles.badgeCriticalText}>Low</AppText>
                </View>
              </View>
            ))}
          </Card>

          <Card padding="md" borderActive={true} elevationActive={true}>
            <View style={styles.sectionHeader}>
              <AppText weight="semibold">Inventory</AppText>
              <Pressable
                style={[
                  styles.miniAction,
                  showOnlyExpiring && styles.miniActionActive,
                ]}
                onPress={() => setShowOnlyExpiring((v) => !v)}
              >
                <AppText
                  style={[
                    styles.miniActionText,
                    showOnlyExpiring && styles.miniActionTextActive,
                  ]}
                >
                  Expiry Only
                </AppText>
              </Pressable>
            </View>

            <View style={styles.filterRow}>
              {(
                [
                  ["all", "All"],
                  ["critical", "Critical"],
                  ["medication", "Medication"],
                  ["supply", "Supplies"],
                ] as [StockFilter, string][]
              ).map(([value, label]) => {
                const active = value === filter;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setFilter(value)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <AppText
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {filteredItems.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AppText style={styles.emptyText}>
                  No stock entries for this filter yet.
                </AppText>
              </View>
            ) : (
              filteredItems.map((item, index) => {
                const level = stockLevel(item);
                const percent = fillPercent(item);
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.inventoryRow,
                      index < filteredItems.length - 1 && styles.inventoryRowDivider,
                    ]}
                  >
                    <View style={styles.inventoryTopRow}>
                      <AppText weight="semibold" style={styles.rowTitle}>
                        {item.name}
                      </AppText>
                      <View
                        style={[
                          styles.levelBadge,
                          level === "good" && styles.levelBadgeGood,
                          level === "watch" && styles.levelBadgeWatch,
                          (level === "critical" || level === "empty") &&
                            styles.levelBadgeCritical,
                        ]}
                      >
                        <AppText style={styles.levelBadgeText}>
                          {level === "good"
                            ? "Good"
                            : level === "watch"
                              ? "Watch"
                              : level === "empty"
                                ? "Empty"
                                : "Critical"}
                        </AppText>
                      </View>
                    </View>

                    <AppText style={styles.rowMeta}>
                      {item.quantity} / {item.capacity} {item.unit} available •
                      Updated {item.lastUpdated}
                    </AppText>

                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${percent}%` }]} />
                    </View>

                    <View style={styles.rowBottom}>
                      <AppText style={styles.rowMeta}>
                        Reorder at {item.reorderPoint} {item.unit}
                      </AppText>
                      {item.expiresAt ? (
                        <AppText style={styles.expiryText}>
                          Expires {item.expiresAt}
                        </AppText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })
            )}
          </Card>

          <Card padding="md" borderActive={true} elevationActive={true}>
            <View style={styles.sectionHeader}>
              <AppText weight="semibold">Expiry Watch</AppText>
              <CalendarClock size={16} color={theme.colors.brand.primary} />
            </View>

            {expiringSoon.map((item) => (
              <View key={item.id} style={styles.expiryRow}>
                <View style={styles.expiryIconWrap}>
                  <CircleCheckBig size={16} color="#1F6C45" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="semibold" style={styles.rowTitle}>
                    {item.name}
                  </AppText>
                  <AppText style={styles.rowMeta}>
                    Expiry date: {item.expiresAt}
                  </AppText>
                </View>
                <ArrowRight size={16} color="rgba(31,45,61,0.55)" />
              </View>
            ))}
          </Card>
        </Section>
      </Screen>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addEventBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addEventText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
  },
  subtitle: {
    marginTop: 4,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metricTile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.10)",
    backgroundColor: "rgba(234,243,251,0.55)",
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.lg,
  },
  metricLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  miniAction: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(31,45,61,0.08)",
  },
  miniActionActive: {
    backgroundColor: "rgba(74,144,226,0.16)",
  },
  miniActionText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  miniActionTextActive: {
    color: theme.colors.brand.dark,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(209,67,67,0.20)",
    backgroundColor: "rgba(209,67,67,0.08)",
    padding: 10,
    marginTop: 8,
  },
  priorityIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(209,67,67,0.16)",
  },
  badgeCritical: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(209,67,67,0.18)",
  },
  badgeCriticalText: {
    color: "#9B2C2C",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  rowTitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  rowMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.15)",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: "rgba(74,144,226,0.24)",
    backgroundColor: "rgba(74,144,226,0.13)",
  },
  filterChipText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: theme.colors.brand.dark,
  },
  emptyWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    padding: 12,
    marginTop: 6,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  inventoryRow: {
    marginTop: 8,
    paddingVertical: 8,
  },
  inventoryRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(31,45,61,0.10)",
  },
  inventoryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelBadgeGood: {
    backgroundColor: "rgba(47,133,90,0.16)",
  },
  levelBadgeWatch: {
    backgroundColor: "rgba(183,121,31,0.16)",
  },
  levelBadgeCritical: {
    backgroundColor: "rgba(209,67,67,0.16)",
  },
  levelBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  progressTrack: {
    marginTop: 8,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(31,45,61,0.10)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.brand.primary,
  },
  rowBottom: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expiryText: {
    color: "#975A16",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  expiryRow: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.10)",
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  expiryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(47,133,90,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
});
