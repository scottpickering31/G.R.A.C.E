import {
  useAccessiblePatients,
  usePrimaryPatientId,
  useSetActivePatient,
} from "@/src/api/medications/hooks";
import AppText from "@/src/components/AppText";
import { useAuthStore } from "@/src/state/auth.store";
import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import { CalendarDays, Check, ChevronDown } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

function getAgeLabel(dob?: string | null) {
  if (!dob) return "Age: --";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "Age: --";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  if (age < 0) return "Age: --";
  return `Age: ${age}`;
}

function formatDob(dob?: string | null) {
  if (!dob) return "DOB not set";
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return "DOB not set";
  return parsed.toLocaleDateString();
}

function roleLabel(role: "owner" | "caregiver" | "clinician" | "read_only") {
  if (role === "read_only") return "Read-only";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function ProfileSwitcher() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showToast } = useUIStore();
  const [showChooser, setShowChooser] = useState(false);
  const { data: activePatientId } = usePrimaryPatientId(userId);
  const { data: accessiblePatients } = useAccessiblePatients(userId);
  const setActivePatientMutation = useSetActivePatient(userId);

  const patients = accessiblePatients ?? [];
  const activePatient = useMemo(() => {
    if (patients.length === 0) return null;
    return (
      patients.find((patient) => patient.id === activePatientId) ?? patients[0]
    );
  }, [activePatientId, patients]);

  const patientName = activePatient?.display_name ?? "Patient";
  const patientDob = activePatient?.dob ?? null;

  return (
    <>
      <View style={styles.textContainer}>
        <Pressable
          style={styles.trigger}
          disabled={!userId || patients.length === 0}
          onPress={() => setShowChooser(true)}
        >
          <View style={styles.container}>
            <AppText style={styles.patientName} weight="bold">
              {patientName}
            </AppText>
            <ChevronDown
              style={styles.chevron}
              size={18}
              color={theme.colors.text.primary}
            />
          </View>
          <View style={styles.container}>
            <CalendarDays size={18} color={theme.colors.text.secondary} />
            <AppText style={styles.subText}>{getAgeLabel(patientDob)}</AppText>
          </View>
        </Pressable>
      </View>

      <Modal
        transparent={true}
        visible={showChooser}
        animationType="fade"
        onRequestClose={() => setShowChooser(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowChooser(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <AppText weight="semibold" style={styles.modalTitle}>
              Choose Patient Profile
            </AppText>
            <AppText style={styles.modalSubtitle}>
              Select which patient should be active across the app.
            </AppText>

            {patients.map((patient) => {
              const isActive = patient.id === activePatient?.id;
              return (
                <Pressable
                  key={patient.id}
                  style={[
                    styles.patientRow,
                    isActive && styles.patientRowActive,
                  ]}
                  disabled={
                    setActivePatientMutation.isPending || !userId || isActive
                  }
                  onPress={async () => {
                    if (!userId || isActive) return;
                    try {
                      await setActivePatientMutation.mutateAsync({
                        userId,
                        patientId: patient.id,
                      });
                      showToast(
                        `${patient.display_name} is now the active patient.`,
                        "success",
                      );
                      setShowChooser(false);
                    } catch (e: any) {
                      showToast(
                        e?.message ?? "Could not switch active patient.",
                        "error",
                      );
                    }
                  }}
                >
                  <View style={styles.patientRowText}>
                    <AppText weight="semibold" style={styles.patientRowName}>
                      {patient.display_name}
                    </AppText>
                    <AppText style={styles.patientRowMeta}>
                      {formatDob(patient.dob)}
                    </AppText>
                    <AppText style={styles.patientRowMeta}>
                      Access Role: {roleLabel(patient.role)}
                    </AppText>
                  </View>
                  {isActive ? (
                    <View style={styles.activeBadge}>
                      <Check size={14} color="#1F6C45" />
                      <AppText style={styles.activeBadgeText}>Active</AppText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}

            <Pressable
              style={styles.closeButton}
              disabled={setActivePatientMutation.isPending}
              onPress={() => setShowChooser(false)}
            >
              <AppText weight="semibold" style={styles.closeButtonText}>
                Close
              </AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  textContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  trigger: {
    alignItems: "center",
  },
  patientName: {
    fontSize: theme.typography.fontSize.lg,
  },
  chevron: {
    marginTop: 4,
    marginLeft: 4,
  },
  subText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(12,18,28,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 14,
    gap: 10,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  patientRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(248,251,255,0.9)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  patientRowActive: {
    borderColor: "rgba(47,133,90,0.24)",
    backgroundColor: "rgba(47,133,90,0.08)",
  },
  patientRowText: {
    flex: 1,
    gap: 2,
  },
  patientRowName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  patientRowMeta: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
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
  closeButton: {
    marginTop: 4,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    backgroundColor: "rgba(245,247,251,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
});
