import Section from "@/components/layout/Section";
import {
  useMedications,
  usePrimaryPatientId,
  useUpcomingMedicationDoses,
} from "@/src/api/medications/hooks";
import { MedicationListItem } from "@/src/api/medications/service";
import AppText from "@/src/components/AppText";
import CurrentTime from "@/src/components/calendar/CurrentTime";
import Card from "@/src/components/layout/Card";
import ListBlock from "@/src/components/layout/ListBlock";
import Screen from "@/src/components/layout/Screen";
import SwipeableTabScreen from "@/src/components/navigation/SwipeableTabScreen";
import AddMedicationModal from "@/src/components/medications/AddMedicationModal";
import MedicationDetailModal from "@/src/components/medications/MedicationDetailModal";
import MedsDueModal, {
  MedsDueWindowHours,
  UpcomingMedication,
} from "@/src/components/medications/MedsDueModal";
import ProfileHeader from "@/src/components/profile/ProfileHeader";
import { useAuthStore } from "@/src/state/auth.store";
import { AlarmClock, Clock, Pill, Plus } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

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
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationListItem | null>(null);
  const [medsWindowHours, setMedsWindowHours] =
    useState<MedsDueWindowHours>(24);

  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: primaryPatientId, refetch: refetchPrimaryPatient } =
    usePrimaryPatientId(userId);
  const { data: upcomingMedsData, refetch: refetchUpcomingMeds } =
    useUpcomingMedicationDoses(primaryPatientId ?? undefined, medsWindowHours);
  const { data: medicationsData, refetch: refetchMedications } = useMedications(
    primaryPatientId ?? undefined,
  );

  const upcomingMeds: UpcomingMedication[] = upcomingMedsData ?? [];
  const medications = useMemo(() => medicationsData ?? [], [medicationsData]);

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

  return (
    <SwipeableTabScreen activeRoute="/(tabs)/medications-treatments">
      <Screen
        screenBackground={require("@/assets/images/clouds.png")}
        useSafeArea={false}
      >
        <Section
          onRefresh={async () => {
            await refetchPrimaryPatient();
            await refetchUpcomingMeds();
            await refetchMedications();
          }}
        >
        <ProfileHeader />

        <Card padding="cardInset" borderActive={true} elevationActive={true}>
          <AppText>Stay on top of medications and monitor treatments.</AppText>
        </Card>

        <Card elevationActive={true} borderActive={true} padding="md">
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <AlarmClock size={20} color="#1F2937" />
              <AppText style={styles.headerText}>Meds Due</AppText>
              <AppText style={styles.headerWindowText}>
                ({medsWindowLabel})
              </AppText>
            </View>
            <View style={styles.headerRight}>
              <Clock size={18} color="#4A90E2" />
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
            onPress={() => setShowAddMedication(true)}
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

        <Card padding="lg" borderActive={true} elevationActive={true}>
          <AppText weight="semibold" style={styles.listTitle}>
            Active Medications
          </AppText>

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
                onPress={() => setSelectedMedication(med)}
              />
            ))
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerText: {
    fontWeight: "600",
  },
  headerWindowText: {
    color: "rgba(31,45,61,0.72)",
    fontSize: 12,
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
  emptyWrap: {
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(234,243,251,0.55)",
  },
  emptyText: {
    color: "rgba(31,45,61,0.78)",
  },
});
