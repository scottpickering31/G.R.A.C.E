import Card from "@/components/layout/Card";
import Section from "@/components/layout/Section";
import ProfileHeader from "@/components/profile/ProfileHeader";
import {
  useMedications,
  usePrimaryPatientId,
} from "@/src/api/medications/hooks";
import { MedicationListItem } from "@/src/api/medications/service";
import AppText from "@/src/components/AppText";
import Screen from "@/src/components/layout/Screen";
import Loading from "@/src/components/Loading";
import AddMedicationModal from "@/src/components/medications/AddMedicationModal";
import MedicationDetailModal from "@/src/components/medications/MedicationDetailModal";
import SwipeableTabScreen from "@/src/components/navigation/SwipeableTabScreen";
import { useAuthStore } from "@/src/state/auth.store";
import { theme } from "@/src/theme";
import {
  AlertTriangle,
  CalendarClock,
  CircleCheckBig,
  PackageOpen,
  Pill,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type StockFilter = "all" | "critical" | "watch" | "healthy" | "unset";

type StockLevel = "critical" | "watch" | "healthy" | "unset";

function getStockLevel(med: MedicationListItem): StockLevel {
  const qty = med.stock_quantity;
  const threshold = med.low_stock_threshold;

  if (qty == null) return "unset";
  if (qty <= 0) return "critical";

  if (threshold != null) {
    if (qty <= threshold) return "critical";
    if (qty <= threshold * 1.5) return "watch";
  }

  if (med.stock_capacity != null && med.stock_capacity > 0) {
    const fillRatio = qty / med.stock_capacity;
    if (fillRatio <= 0.25) return "watch";
  }

  return "healthy";
}

function formatQuantity(value: number | null, unit: string | null) {
  if (value == null) return "Not set";
  const normalized = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${normalized}${unit ? ` ${unit}` : ""}`;
}

function formatDateLabel(value: string | null) {
  if (!value) return "No expiry";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No expiry";
  return d.toLocaleDateString();
}

function daysUntil(dateIso: string | null) {
  if (!dateIso) return null;
  const target = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  return Math.round((targetDate.getTime() - today.getTime()) / 86_400_000);
}

export default function Stock() {
  const [filter, setFilter] = useState<StockFilter>("all");
  const [showOnlyExpiring, setShowOnlyExpiring] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationListItem | null>(null);

  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: primaryPatientId, refetch: refetchPrimaryPatient } =
    usePrimaryPatientId(userId);
  const {
    data: medicationsData,
    isLoading,
    refetch: refetchMedications,
  } = useMedications(primaryPatientId ?? undefined);

  const medications = useMemo(() => medicationsData ?? [], [medicationsData]);

  const summary = useMemo(() => {
    const critical = medications.filter(
      (med) => getStockLevel(med) === "critical",
    );
    const watch = medications.filter((med) => getStockLevel(med) === "watch");
    const configured = medications.filter((med) => med.stock_quantity != null);
    const unset = medications.filter((med) => getStockLevel(med) === "unset");

    return {
      critical: critical.length,
      watch: watch.length,
      configured: configured.length,
      unset: unset.length,
      total: medications.length,
    };
  }, [medications]);

  const expiringSoon = useMemo(
    () =>
      medications
        .filter((med) => med.expires_at)
        .sort((a, b) => (a.expires_at ?? "").localeCompare(b.expires_at ?? ""))
        .slice(0, 4),
    [medications],
  );

  const filteredItems = useMemo(() => {
    return medications.filter((med) => {
      if (showOnlyExpiring && !med.expires_at) return false;
      if (filter === "all") return true;
      return getStockLevel(med) === filter;
    });
  }, [filter, medications, showOnlyExpiring]);

  const priorityItems = useMemo(
    () =>
      medications
        .filter((med) => {
          const level = getStockLevel(med);
          return level === "critical" || level === "watch";
        })
        .sort((a, b) => {
          const aQty = a.stock_quantity ?? Number.POSITIVE_INFINITY;
          const bQty = b.stock_quantity ?? Number.POSITIVE_INFINITY;
          return aQty - bQty;
        })
        .slice(0, 4),
    [medications],
  );

  if (isLoading && !medicationsData) {
    return <Loading />;
  }

  return (
    <SwipeableTabScreen activeRoute="/(tabs)/stock">
      <Screen
        screenBackground={require("@/assets/images/clouds.png")}
        useSafeArea={false}
      >
        <Section
          onRefresh={async () => {
            await refetchPrimaryPatient();
            await refetchMedications();
          }}
        >
          <View style={styles.headerRow}>
            <ProfileHeader style={{ width: "58%" }} />
          </View>

          <Card padding="md" borderActive={true} elevationActive={true}>
            <AppText weight="semibold" style={styles.title}>
              Stock Control
            </AppText>
            <AppText style={styles.subtitle}>
              Live inventory pulled from medication records and stock values.
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
                  {summary.configured}/{summary.total}
                </AppText>
                <AppText style={styles.metricLabel}>Configured</AppText>
              </View>
              <View style={styles.metricTile}>
                <PackageOpen size={16} color="#4A5568" />
                <AppText weight="bold" style={styles.metricValue}>
                  {summary.unset}
                </AppText>
                <AppText style={styles.metricLabel}>Unset</AppText>
              </View>
            </View>
          </Card>

          <Card padding="md" borderActive={true} elevationActive={true}>
            <View style={styles.sectionHeader}>
              <AppText weight="semibold">Low Stock Priority</AppText>
              <AppText style={styles.sectionHint}>Top 4 by urgency</AppText>
            </View>

            {priorityItems.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AppText style={styles.emptyText}>
                  No urgent stock issues right now.
                </AppText>
              </View>
            ) : (
              priorityItems.map((item) => {
                const level = getStockLevel(item);
                return (
                  <Pressable
                    key={item.id}
                    style={styles.priorityRow}
                    onPress={() => setSelectedMedication(item)}
                  >
                    <View style={styles.priorityIconWrap}>
                      <PackageOpen size={16} color="#D14343" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText weight="semibold" style={styles.rowTitle}>
                        {item.name}
                      </AppText>
                      <AppText style={styles.rowMeta}>
                        {formatQuantity(item.stock_quantity, item.stock_unit)} •
                        Reorder at{" "}
                        {formatQuantity(
                          item.low_stock_threshold,
                          item.stock_unit,
                        )}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.levelBadge,
                        level === "critical"
                          ? styles.levelBadgeCritical
                          : styles.levelBadgeWatch,
                      ]}
                    >
                      <AppText style={styles.levelBadgeText}>
                        {level === "critical" ? "Critical" : "Watch"}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })
            )}
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
                  ["watch", "Watch"],
                  ["healthy", "Healthy"],
                  ["unset", "Unset"],
                ] as [StockFilter, string][]
              ).map(([value, label]) => {
                const active = value === filter;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setFilter(value)}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
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
                  No medications match this filter.
                </AppText>
              </View>
            ) : (
              filteredItems.map((item) => {
                const level = getStockLevel(item);
                const capacity =
                  item.stock_capacity ?? item.stock_quantity ?? 0;
                const quantity = item.stock_quantity ?? 0;
                const percent =
                  capacity > 0
                    ? Math.max(
                        0,
                        Math.min(100, Math.round((quantity / capacity) * 100)),
                      )
                    : 0;

                return (
                  <Pressable
                    key={item.id}
                    style={styles.inventoryRow}
                    onPress={() => setSelectedMedication(item)}
                  >
                    <View style={styles.inventoryTopRow}>
                      <AppText weight="semibold" style={styles.rowTitle}>
                        {item.name}
                      </AppText>
                      <View
                        style={[
                          styles.levelBadge,
                          level === "critical" && styles.levelBadgeCritical,
                          level === "watch" && styles.levelBadgeWatch,
                          level === "healthy" && styles.levelBadgeHealthy,
                          level === "unset" && styles.levelBadgeUnset,
                        ]}
                      >
                        <AppText style={styles.levelBadgeText}>{level}</AppText>
                      </View>
                    </View>

                    <AppText style={styles.rowMeta}>
                      Current:{" "}
                      {formatQuantity(item.stock_quantity, item.stock_unit)} •
                      Capacity:{" "}
                      {formatQuantity(item.stock_capacity, item.stock_unit)}
                    </AppText>

                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, { width: `${percent}%` }]}
                      />
                    </View>

                    <View style={styles.rowBottom}>
                      <AppText style={styles.rowMeta}>
                        Low Capacity Threshold:{" "}
                        {formatQuantity(
                          item.low_stock_threshold,
                          item.stock_unit,
                        )}
                      </AppText>
                      <AppText style={styles.expiryText}>
                        Expiry: {formatDateLabel(item.expires_at)}
                      </AppText>
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

            {expiringSoon.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AppText style={styles.emptyText}>
                  No expiry dates set yet.
                </AppText>
              </View>
            ) : (
              expiringSoon.map((item) => {
                const days = daysUntil(item.expires_at);
                return (
                  <Pressable
                    key={item.id}
                    style={styles.expiryRow}
                    onPress={() => setSelectedMedication(item)}
                  >
                    <View style={styles.expiryIconWrap}>
                      <CircleCheckBig size={16} color="#1F6C45" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText weight="semibold" style={styles.rowTitle}>
                        {item.name}
                      </AppText>
                      <AppText style={styles.rowMeta}>
                        {formatDateLabel(item.expires_at)}
                        {days != null ? ` (${days} days)` : ""}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })
            )}
          </Card>

          <AddMedicationModal
            visible={showAddMedication}
            onClose={() => setShowAddMedication(false)}
            patientId={primaryPatientId ?? undefined}
            userId={userId}
          />
          <MedicationDetailModal
            visible={!!selectedMedication}
            onClose={() => setSelectedMedication(null)}
            medication={selectedMedication}
            patientId={primaryPatientId ?? undefined}
          />
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
  addBtn: {
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
  addBtnText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
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
  sectionHint: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
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
  rowTitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  rowMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelBadgeCritical: {
    backgroundColor: "rgba(209,67,67,0.16)",
  },
  levelBadgeWatch: {
    backgroundColor: "rgba(183,121,31,0.16)",
  },
  levelBadgeHealthy: {
    backgroundColor: "rgba(47,133,90,0.18)",
  },
  levelBadgeUnset: {
    backgroundColor: "rgba(31,45,61,0.12)",
  },
  levelBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    textTransform: "capitalize",
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
    marginTop: 4,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  inventoryRow: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.10)",
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 10,
  },
  inventoryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
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
