import Section from "@/components/layout/Section";
import {
  useMedications,
  usePrimaryPatientId,
  useUpcomingMedicationDoses,
} from "@/src/api/medications/hooks";
import AppText from "@/src/components/AppText";
import Card from "@/src/components/layout/Card";
import ListBlock from "@/src/components/layout/ListBlock";
import Screen from "@/src/components/layout/Screen";
import AddMedicationModal from "@/src/components/medications/AddMedicationModal";
import MedsDueModal, {
  UpcomingMedication,
} from "@/src/components/medications/MedsDueModal";
import ProfileHeader from "@/src/components/profile/ProfileHeader";
import { useAuthStore } from "@/src/state/auth.store";
import { AlarmClock, Pill, PillBottle, Plus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

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

  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: primaryPatientId } = usePrimaryPatientId(userId);
  const { data: upcomingMedsData } = useUpcomingMedicationDoses(primaryPatientId ?? undefined);
  const { data: medicationsData } = useMedications(primaryPatientId ?? undefined);

  const upcomingMeds: UpcomingMedication[] = upcomingMedsData ?? [];
  const medications = medicationsData ?? [];

  const nextDueLabel = (() => {
    if (!upcomingMeds.length) return "No upcoming doses";
    const first = [...upcomingMeds].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())[0];
    return `Next: ${first.dueAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  })();

  return (
    <Screen
      screenBackground={require("@/assets/images/clouds.png")}
      useSafeArea={false}
    >
      <Section>
        <ProfileHeader />

        <Card padding="cardInset" borderActive={true} elevationActive={true}>
          <AppText>Stay on top of medications and monitor treatments.</AppText>
        </Card>

        <Card elevationActive={true} borderActive={true} padding="md">
          <View style={styles.headerRow}>
            <AlarmClock size={20} color="#1F2937" />
            <AppText style={styles.headerText}>Medication Actions</AppText>
          </View>

          <ListBlock
            Icon={PillBottle}
            iconBgColor="rgba(74, 144, 226, 0.18)"
            title="Meds Due"
            subtitle={nextDueLabel}
            rightText={`${upcomingMeds.length} upcoming`}
            showChevron={false}
            onPress={() => setShowMedsDue(true)}
          />

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
                showChevron={false}
              />
            ))
          )}
        </Card>

        <MedsDueModal
          visible={showMedsDue}
          onClose={() => setShowMedsDue(false)}
          items={upcomingMeds}
        />
        <AddMedicationModal
          visible={showAddMedication}
          onClose={() => setShowAddMedication(false)}
          patientId={primaryPatientId ?? undefined}
          userId={userId}
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  headerText: {
    fontWeight: "600",
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
