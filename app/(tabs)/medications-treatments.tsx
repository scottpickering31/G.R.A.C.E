import Section from "@/components/layout/Section";
import {
  useActivePatientMembership,
  useClearMedicationHistoryException,
  useLogMedicationHistoryException,
  useMedicationHistory,
  useMedications,
  usePrimaryPatientId,
  useUpcomingMedicationDoses,
} from "@/src/api/medications/hooks";
import {
  MedicationHistoryItem,
  MedicationListItem,
} from "@/src/api/medications/service";
import AppText from "@/src/components/AppText";
import CurrentTime from "@/src/components/calendar/CurrentTime";
import Card from "@/src/components/layout/Card";
import ListBlock from "@/src/components/layout/ListBlock";
import Screen from "@/src/components/layout/Screen";
import SwipeableTabScreen from "@/src/components/navigation/SwipeableTabScreen";
import AddMedicationModal from "@/src/components/medications/AddMedicationModal";
import MedicationHistoryModal from "@/src/components/medications/MedicationHistoryModal";
import MedicationDetailModal from "@/src/components/medications/MedicationDetailModal";
import MedsDueModal, {
  MedsDueWindowHours,
  UpcomingMedication,
} from "@/src/components/medications/MedsDueModal";
import ProfileHeader from "@/src/components/profile/ProfileHeader";
import { useAuthStore } from "@/src/state/auth.store";
import { useUIStore } from "@/state/ui.store";
import { theme } from "@/src/theme";
import { AlarmClock, Clock, Pill, Plus, ShieldCheck, Stethoscope } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

function format24HourWithMeridiem(d: Date) {
  const time24 = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const meridiem = d.toLocaleTimeString([], {
    hour: "numeric",
    hour12: true,
  });
  const suffix = meridiem.slice(-2).toUpperCase();
  return `${time24} ${suffix}`;
}

function formatSchedule(
  scheduleType: "as_needed" | "daily_same_time" | "one_off",
  scheduleTimes: string[],
  oneOffDueAt: string | null,
) {
  if (scheduleType === "daily_same_time" && scheduleTimes.length > 0) {
    const times = scheduleTimes
      .map((time) => {
        const [hour, minute] = time.slice(0, 5).split(":");
        const hourNum = Number(hour);
        const suffix = hourNum >= 12 ? "PM" : "AM";
        const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
        return `${hour12}:${minute} ${suffix}`;
      })
      .join(", ");
    return `Daily at ${times}`;
  }
  if (scheduleType === "one_off" && oneOffDueAt) {
    const d = new Date(oneOffDueAt);
    return `One-off ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return "As needed";
}

function formatStock(quantity: number | null, unit: string | null) {
  if (quantity == null) return "Stock not set";
  return `${quantity}${unit ? ` ${unit}` : ""}`;
}

function formatRoute(route: string) {
  const withSpaces = route.replace(/_/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export default function MedicationsTreatments() {
  const [showMedsDue, setShowMedsDue] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationListItem | null>(null);
  const [medsWindowHours, setMedsWindowHours] =
    useState<MedsDueWindowHours>(24);
  const sectionScrollRef = useRef<ScrollView | null>(null);
  const activeMedsSectionY = useRef(0);
  const { showToast } = useUIStore();

  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: activeMembership } = useActivePatientMembership(userId);
  const { data: primaryPatientId, refetch: refetchPrimaryPatient } =
    usePrimaryPatientId(userId);
  const { data: upcomingMedsData, refetch: refetchUpcomingMeds } =
    useUpcomingMedicationDoses(primaryPatientId ?? undefined, medsWindowHours);
  const { data: medicationsData, refetch: refetchMedications } = useMedications(
    primaryPatientId ?? undefined,
  );
  const { data: historyData, refetch: refetchHistory } = useMedicationHistory(
    primaryPatientId ?? undefined,
    7,
  );
  const logHistoryException = useLogMedicationHistoryException(
    primaryPatientId ?? undefined,
  );
  const clearHistoryException = useClearMedicationHistoryException(
    primaryPatientId ?? undefined,
  );

  const upcomingMeds: UpcomingMedication[] = upcomingMedsData ?? [];
  const medications = useMemo(() => medicationsData ?? [], [medicationsData]);
  const historyItems = useMemo(() => historyData ?? [], [historyData]);
  const isReadOnly = activeMembership?.role === "read_only";

  useEffect(() => {
    if (!isReadOnly) return;
    if (showAddMedication) {
      setShowAddMedication(false);
      showToast("Read-only access: unable to add medication.", "info");
    }
  }, [isReadOnly, showAddMedication, showToast]);

  useEffect(() => {
    if (!selectedMedication) return;
    const updated =
      medications.find((m) => m.id === selectedMedication.id) ?? null;
    if (!updated || updated === selectedMedication) return;
    setSelectedMedication(updated);
  }, [medications, selectedMedication]);

  const nextDueLabel = (() => {
    if (!upcomingMeds.length) return "No upcoming doses";
    const first = [...upcomingMeds].sort(
      (a, b) => a.dueAt.getTime() - b.dueAt.getTime(),
    )[0];
    return `Due at: ${format24HourWithMeridiem(first.dueAt)}`;
  })();
  const nextMedicationName = (() => {
    if (!upcomingMeds.length) return "No meds due";
    const first = [...upcomingMeds].sort(
      (a, b) => a.dueAt.getTime() - b.dueAt.getTime(),
    )[0];
    return first.name;
  })();
  const nextMedicationDose = (() => {
    if (!upcomingMeds.length) return "";
    const first = [...upcomingMeds].sort(
      (a, b) => a.dueAt.getTime() - b.dueAt.getTime(),
    )[0];
    return first.dose;
  })();
  const medsWindowLabel =
    medsWindowHours === 1
      ? "Next hour"
      : medsWindowHours === 24
        ? "Next 24 hours"
        : "Next 7 days";
  const dueCount = upcomingMeds.length;
  const activeCount = medications.length;
  const rotateWindowHours = () => {
    setMedsWindowHours((prev) => {
      if (prev === 1) return 24;
      if (prev === 24) return 168;
      return 1;
    });
  };
  const scrollToActiveMedications = () => {
    sectionScrollRef.current?.scrollTo({
      y: Math.max(0, activeMedsSectionY.current - 12),
      animated: true,
    });
  };

  return (
    <SwipeableTabScreen activeRoute="/(tabs)/medications-treatments">
      <Screen
        screenBackground={require("@/assets/images/clouds.png")}
        useSafeArea={false}
      >
        <Section
          scrollRef={sectionScrollRef}
          onRefresh={async () => {
            await refetchPrimaryPatient();
            await refetchUpcomingMeds();
            await refetchMedications();
            await refetchHistory();
          }}
        >
          <View style={styles.headerRow}>
            <ProfileHeader />
          </View>

          <Card
            padding="md"
            borderActive={true}
            elevationActive={true}
            style={styles.heroCard}
          >
            <AppText weight="bold" style={styles.heroTitle}>
              Medication & Treatment Hub
            </AppText>
            <AppText style={styles.heroSubtitle}>
              Keep medication schedules, dosage, and treatment routines aligned.
            </AppText>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaChip}>
                <Clock size={14} color={theme.colors.brand.dark} />
                <AppText style={styles.heroMetaText}>{nextDueLabel}</AppText>
              </View>
              <View style={styles.heroMetaChip}>
                <AlarmClock size={14} color={theme.colors.brand.dark} />
                <AppText style={styles.heroMetaText}>{medsWindowLabel}</AppText>
              </View>
            </View>
          </Card>

          <View style={styles.metricsRow}>
            <Pressable onPress={scrollToActiveMedications} style={styles.metricPressable}>
              <Card
                elevationActive={true}
                borderActive={true}
                padding="md"
                style={styles.metricCard}
              >
                <Pill size={16} color={theme.colors.brand.primary} />
                <AppText weight="bold" style={styles.metricValue}>
                  {activeCount}
                </AppText>
                <AppText style={styles.metricLabel}>Active</AppText>
              </Card>
            </Pressable>
            <Pressable onPress={() => setShowMedsDue(true)} style={styles.metricPressable}>
              <Card
                elevationActive={true}
                borderActive={true}
                padding="md"
                style={styles.metricCard}
              >
                <AlarmClock size={16} color="#B7791F" />
                <AppText weight="bold" style={styles.metricValue}>
                  {dueCount}
                </AppText>
                <AppText style={styles.metricLabel}>Due</AppText>
              </Card>
            </Pressable>
            <Pressable onPress={rotateWindowHours} style={styles.metricPressable}>
              <Card
                elevationActive={true}
                borderActive={true}
                padding="md"
                style={styles.metricCard}
              >
                <Stethoscope size={16} color="#2F855A" />
                <AppText weight="bold" style={styles.metricValue}>
                  {medsWindowHours === 168 ? "7D" : medsWindowHours === 24 ? "24H" : "1H"}
                </AppText>
                <AppText style={styles.metricLabel}>Window</AppText>
              </Card>
            </Pressable>
          </View>

          <Card elevationActive={true} borderActive={true} padding="md">
            <View style={styles.sectionTitleRow}>
              <AppText style={styles.sectionTitle}>Meds Due</AppText>
              <View style={styles.liveChip}>
                <Clock size={14} color={theme.colors.brand.dark} />
                <CurrentTime />
              </View>
            </View>

            <Pressable
              style={styles.featuredMedsCard}
              onPress={() => setShowMedsDue(true)}
            >
              <AppText
                weight="bold"
                style={styles.featuredMedicationName}
                numberOfLines={1}
              >
                Next Medication: {nextMedicationName}
              </AppText>
              {nextMedicationDose ? (
                <AppText style={styles.featuredDoseText} numberOfLines={1}>
                  Dose: {nextMedicationDose}
                </AppText>
              ) : null}
              <AppText style={styles.featuredDueText}>{nextDueLabel}</AppText>
            </Pressable>

            <Pressable
              style={styles.addButton}
              onPress={() => {
                if (isReadOnly) {
                  showToast("Read-only access: cannot add medications.", "info");
                  return;
                }
                setShowAddMedication(true);
              }}
            >
              <View style={styles.addIconWrap}>
                <Plus size={16} color="#2B6CB0" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="semibold" style={styles.addTitle}>
                  Add Medication
                </AppText>
                <AppText style={styles.addSubtitle}>
                  Search RxNorm and save to this patient profile.
                </AppText>
              </View>
            </Pressable>
          </Card>

          <View
            onLayout={(event) => {
              activeMedsSectionY.current = event.nativeEvent.layout.y;
            }}
          >
            <Card padding="lg" borderActive={true} elevationActive={true}>
            <View style={styles.sectionTitleRow}>
              <AppText weight="semibold" style={styles.listTitle}>
                Active Medications
              </AppText>
              <View style={styles.safeChip}>
                <ShieldCheck size={14} color="#1F6C45" />
                <AppText style={styles.safeChipText}>Tracking Enabled</AppText>
              </View>
            </View>

            {medications.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AppText style={styles.emptyText}>
                  No active medications yet. Tap Add Medication to start.
                </AppText>
              </View>
            ) : (
              medications.map((med) => (
                <ListBlock
                  key={med.id}
                  Icon={Pill}
                  iconBgColor="rgba(74, 144, 226, 0.18)"
                  title={med.name}
                  subtitle={`${formatSchedule(med.schedule_type, med.schedule_times, med.one_off_due_at)} • ${formatRoute(med.route)}${med.instructions ? ` • ${med.instructions}` : ""}`}
                  rightText={`${med.dose ?? "Dose not set"} • ${formatStock(med.stock_quantity, med.stock_unit)}`}
                  showChevron={true}
                  onPress={() => {
                    setSelectedMedication(med);
                  }}
                />
              ))
            )}
            </Card>
          </View>

          <Card padding="lg" borderActive={true} elevationActive={true}>
            <View style={styles.sectionTitleRow}>
              <AppText weight="semibold" style={styles.listTitle}>
                Medication History (Last 7 Days)
              </AppText>
              <View style={styles.safeChip}>
                <ShieldCheck size={14} color="#1F6C45" />
                <AppText style={styles.safeChipText}>Assumed Taken</AppText>
              </View>
            </View>

            {historyItems.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AppText style={styles.emptyText}>
                  No medication history available yet.
                </AppText>
              </View>
            ) : (
              <Pressable
                style={styles.historyOpenButton}
                onPress={() => setShowHistoryModal(true)}
              >
                <AppText weight="semibold" style={styles.historyOpenTitle}>
                  Open Medication History
                </AppText>
                <AppText style={styles.historyOpenSubtitle}>
                  View and update the latest {Math.min(historyItems.length, 50)} history entries.
                </AppText>
              </Pressable>
            )}
          </Card>

          <MedsDueModal
            visible={showMedsDue}
            onClose={() => setShowMedsDue(false)}
            items={upcomingMeds}
            windowHours={medsWindowHours}
            onChangeWindowHours={setMedsWindowHours}
          />
          <AddMedicationModal
            visible={showAddMedication && !isReadOnly}
            onClose={() => setShowAddMedication(false)}
            patientId={primaryPatientId ?? undefined}
            userId={userId}
          />
          <MedicationDetailModal
            visible={!!selectedMedication}
            onClose={() => setSelectedMedication(null)}
            medication={selectedMedication}
            patientId={primaryPatientId ?? undefined}
            canEdit={!isReadOnly}
          />
          <MedicationHistoryModal
            visible={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            items={historyItems.slice(0, 50)}
            isSaving={logHistoryException.isPending || clearHistoryException.isPending}
            canEdit={!isReadOnly}
            onChangeStatus={async (
              item: MedicationHistoryItem,
              status: "taken" | "skipped" | "rejected",
            ) => {
              if (isReadOnly) return;
              if (!primaryPatientId) return;
              try {
                if (status === "taken") {
                  await clearHistoryException.mutateAsync({
                    patientId: primaryPatientId,
                    medicationId: item.medicationId,
                    dueAt: item.dueAt.toISOString(),
                  });
                  return;
                }
                if (!userId) return;
                await logHistoryException.mutateAsync({
                  patientId: primaryPatientId,
                  userId,
                  medicationId: item.medicationId,
                  dueAt: item.dueAt.toISOString(),
                  eventType: status,
                  note:
                    status === "skipped"
                      ? "Dose skipped"
                      : "Dose vomited/rejected",
                });
              } catch (e: any) {
                showToast(e?.message ?? "Could not update medication status.", "error");
              }
            }}
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
  heroCard: {
    backgroundColor: "rgba(234,243,251,0.85)",
    borderColor: "rgba(74,144,226,0.18)",
  },
  heroTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  heroSubtitle: {
    marginTop: 4,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  heroMetaRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  heroMetaChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.2)",
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroMetaText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
    color: theme.colors.brand.dark,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metricPressable: {
    flex: 1,
  },
  metricCard: {
    flex: 1,
    alignItems: "center",
    minHeight: 96,
  },
  metricValue: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.lg,
  },
  metricLabel: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  liveChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.2)",
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButton: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.18)",
  },
  addTitle: {
    color: "#1F2937",
    fontSize: 14,
  },
  addSubtitle: {
    color: "rgba(31,45,61,0.72)",
    fontSize: 12,
    marginTop: 2,
  },
  featuredMedsCard: {
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.25)",
    backgroundColor: "rgba(74,144,226,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  featuredMedicationName: {
    color: "#1F2937",
    fontSize: 18,
  },
  featuredDueText: {
    color: "#2B6CB0",
    fontSize: 13,
  },
  featuredDoseText: {
    color: "rgba(31,45,61,0.72)",
    fontSize: 12,
    marginTop: 1,
  },
  listTitle: {
    marginBottom: 2,
    fontSize: 15,
  },
  safeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(47,133,90,0.22)",
    backgroundColor: "rgba(47,133,90,0.10)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  safeChipText: {
    color: "#1F6C45",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  emptyWrap: {
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(234,243,251,0.55)",
  },
  emptyText: {
    color: "rgba(31,45,61,0.78)",
  },
  historyOpenButton: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 3,
  },
  historyOpenTitle: {
    color: "#1F2937",
    fontSize: 14,
  },
  historyOpenSubtitle: {
    color: "rgba(31,45,61,0.72)",
    fontSize: 12,
  },
});
