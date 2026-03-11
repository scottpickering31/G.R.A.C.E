import Section from "@/components/layout/Section";
import {
  useAccessiblePatients,
  useCreatePatientProfile,
  usePrimaryPatientId,
  useSetActivePatient,
} from "@/src/api/medications/hooks";
import AppText from "@/src/components/AppText";
import MonthCalendarModal from "@/src/components/calendar/MonthCalendarModal";
import Card from "@/src/components/layout/Card";
import Screen from "@/src/components/layout/Screen";
import PageSkeleton from "@/src/components/loading/PageSkeleton";
import { useAuthStore } from "@/src/state/auth.store";
import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import { router } from "expo-router";
import {
  CalendarDays,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";

function roleLabel(role: "owner" | "caregiver" | "clinician" | "read_only") {
  if (role === "read_only") return "Read-only";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDob(dob: string | null) {
  if (!dob) return "DOB not set";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "DOB not set";
  return d.toLocaleDateString();
}

function formatISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDobDefaultDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 20);
  return d;
}

export default function PatientProfiles() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showToast } = useUIStore();
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientDobDate, setNewPatientDobDate] = useState<Date | null>(null);
  const [showDobCalendar, setShowDobCalendar] = useState(false);
  const { data: activePatientId } = usePrimaryPatientId(userId);
  const {
    data: accessiblePatients,
    isLoading,
    refetch: refetchAccessiblePatients,
  } = useAccessiblePatients(userId);
  const setActivePatientMutation = useSetActivePatient(userId);
  const createPatientProfileMutation = useCreatePatientProfile(userId);
  const patientCount = accessiblePatients?.length ?? 0;
  const canAddPatient = patientCount < 2;

  if (isLoading && !accessiblePatients) {
    return <PageSkeleton sectionCount={1} rowCount={3} />;
  }

  return (
    <Screen
      screenBackground={require("@/assets/images/clouds.png")}
      useSafeArea={false}
    >
      <Section
        onRefresh={async () => {
          await refetchAccessiblePatients();
        }}
      >
        <Card
          padding="md"
          borderActive={true}
          elevationActive={true}
          style={styles.heroCard}
        >
          <AppText weight="bold" style={styles.heroTitle}>
            Patient Profiles
          </AppText>
          <AppText style={styles.heroSubtitle}>
            Patients you can access and which profile is currently active.
          </AppText>
        </Card>

        <Card padding="md" borderActive={true} elevationActive={true}>
          <View style={styles.sectionHeader}>
            <AppText weight="semibold" style={styles.sectionTitle}>
              Accessible Patients
            </AppText>
            <AppText style={styles.sectionHint}>{patientCount}/2</AppText>
          </View>
          <Pressable
            style={[
              styles.addPatientBtn,
              !canAddPatient && styles.addPatientBtnDisabled,
            ]}
            disabled={!canAddPatient || createPatientProfileMutation.isPending}
            onPress={() => {
              if (!canAddPatient) {
                showToast("You can only have a maximum of 2 patients.", "info");
                return;
              }
              setShowAddPatientModal(true);
            }}
          >
            <Plus size={14} color={theme.colors.brand.dark} />
            <AppText weight="semibold" style={styles.addPatientBtnText}>
              Add Patient
            </AppText>
          </Pressable>
          {!canAddPatient ? (
            <AppText style={styles.limitHintText}>
              Limit reached: each user can have up to 2 patients.
            </AppText>
          ) : null}

          {!accessiblePatients || accessiblePatients.length === 0 ? (
            <View style={styles.emptyWrap}>
              <AppText style={styles.emptyText}>
                No patient profiles available for this user yet.
              </AppText>
            </View>
          ) : (
            accessiblePatients.map((patient) => {
              const isActive =
                patient.id === activePatientId || patient.isActive;
              return (
                <Pressable
                  key={patient.id}
                  style={styles.patientRow}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/(pages)/patient-profile/[patientId]",
                      params: { patientId: patient.id },
                    })
                  }
                >
                  <View style={styles.patientIconWrap}>
                    <UserRound size={16} color={theme.colors.brand.dark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.patientNameRow}>
                      <AppText weight="semibold" style={styles.patientName}>
                        {patient.display_name}
                      </AppText>
                      {isActive ? (
                        <View style={styles.activeBadge}>
                          <ShieldCheck size={12} color="#1F6C45" />
                          <AppText style={styles.activeBadgeText}>
                            Active
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.metaRow}>
                      <CalendarDays
                        size={12}
                        color={theme.colors.text.secondary}
                      />
                      <AppText style={styles.metaText}>
                        {formatDob(patient.dob)}
                      </AppText>
                    </View>
                    <AppText style={styles.metaText}>
                      Access Role: {roleLabel(patient.role)}
                    </AppText>
                    {patient.role === "read_only" ? (
                      <View style={styles.linkedBadge}>
                        <AppText style={styles.linkedBadgeText}>
                          Linked via Secret Code
                        </AppText>
                      </View>
                    ) : null}
                    <AppText style={styles.viewHintText}>
                      Tap to view profile details
                    </AppText>
                    {!isActive ? (
                      <Pressable
                        style={styles.setActiveBtn}
                        disabled={setActivePatientMutation.isPending}
                        onPress={async (event) => {
                          event.stopPropagation();
                          if (!userId) return;
                          try {
                            await setActivePatientMutation.mutateAsync({
                              userId,
                              patientId: patient.id,
                            });
                            showToast(
                              `${patient.display_name} is now the active patient.`,
                              "success",
                            );
                          } catch (e: any) {
                            showToast(
                              e?.message ?? "Could not set active patient.",
                              "error",
                            );
                          }
                        }}
                      >
                        <AppText
                          weight="semibold"
                          style={styles.setActiveBtnText}
                        >
                          Set Active
                        </AppText>
                      </Pressable>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>
      </Section>

      <Modal
        visible={showAddPatientModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddPatientModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowAddPatientModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <AppText weight="bold" style={styles.modalTitle}>
              Add a Patient
            </AppText>
            <AppText style={styles.modalSubtitle}>
              You can add up to 2 patients per account.
            </AppText>

            <AppText weight="semibold" style={styles.inputLabel}>
              Patient Name
            </AppText>
            <TextInput
              value={newPatientName}
              onChangeText={setNewPatientName}
              placeholder="e.g. Katie Smith"
              placeholderTextColor="rgba(31,45,61,0.45)"
              style={styles.input}
            />

            <AppText weight="semibold" style={styles.inputLabel}>
              Date of Birth *
            </AppText>
            <Pressable
              style={styles.input}
              onPress={() => setShowDobCalendar(true)}
            >
              <AppText
                style={
                  newPatientDobDate
                    ? styles.inputValueText
                    : styles.inputPlaceholderText
                }
              >
                {newPatientDobDate
                  ? formatISODate(newPatientDobDate)
                  : "Select from calendar"}
              </AppText>
            </Pressable>

            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setShowAddPatientModal(false);
                  setNewPatientName("");
                  setNewPatientDobDate(null);
                }}
              >
                <AppText weight="semibold">Cancel</AppText>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryBtn}
                disabled={createPatientProfileMutation.isPending}
                onPress={async () => {
                  if (!userId) return;
                  const name = newPatientName.trim();
                  if (!name) {
                    showToast("Please enter a patient name.", "error");
                    return;
                  }
                  if (!newPatientDobDate) {
                    showToast("Please select date of birth.", "error");
                    return;
                  }
                  try {
                    await createPatientProfileMutation.mutateAsync({
                      userId,
                      displayName: name,
                      dob: formatISODate(newPatientDobDate),
                    });
                    showToast("Patient profile created.", "success");
                    setShowAddPatientModal(false);
                    setNewPatientName("");
                    setNewPatientDobDate(null);
                  } catch (e: any) {
                    showToast(
                      e?.message ?? "Could not create patient profile.",
                      "error",
                    );
                  }
                }}
              >
                <AppText weight="semibold" style={styles.modalPrimaryBtnText}>
                  {createPatientProfileMutation.isPending ? "Adding..." : "Add"}
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <MonthCalendarModal
        visible={showDobCalendar}
        initialDate={newPatientDobDate ?? getDobDefaultDate()}
        onClose={() => setShowDobCalendar(false)}
        onSelect={(selectedDate) => {
          const today = new Date();
          const selectedMidnight = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
          );
          const todayMidnight = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );
          if (selectedMidnight > todayMidnight) {
            showToast("Date of birth cannot be in the future.", "error");
            return;
          }
          setNewPatientDobDate(selectedMidnight);
          setShowDobCalendar(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
  },
  sectionHint: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  addPatientBtn: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addPatientBtnDisabled: {
    opacity: 0.5,
  },
  addPatientBtnText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
  },
  limitHintText: {
    marginTop: 6,
    color: "#975A16",
    fontSize: theme.typography.fontSize.xs,
  },
  patientRow: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(255,255,255,0.88)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  patientIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.13)",
  },
  patientNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  patientName: {
    fontSize: theme.typography.fontSize.sm,
    flexShrink: 1,
  },
  activeBadge: {
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
  activeBadgeText: {
    color: "#1F6C45",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  metaRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  linkedBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.32)",
    backgroundColor: "rgba(74,144,226,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  linkedBadgeText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  setActiveBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  setActiveBtnText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
  },
  viewHintText: {
    marginTop: 6,
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  emptyWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    backgroundColor: "rgba(255,255,255,0.68)",
    padding: 12,
    marginTop: 10,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 14,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  modalSubtitle: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  inputLabel: {
    marginTop: 10,
    marginBottom: 5,
    fontSize: theme.typography.fontSize.xs,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  inputValueText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  inputPlaceholderText: {
    color: "rgba(31,45,61,0.45)",
    fontSize: theme.typography.fontSize.sm,
  },
  modalActionRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  modalSecondaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 9,
    alignItems: "center",
  },
  modalPrimaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingVertical: 9,
    alignItems: "center",
  },
  modalPrimaryBtnText: {
    color: theme.colors.brand.dark,
  },
});
