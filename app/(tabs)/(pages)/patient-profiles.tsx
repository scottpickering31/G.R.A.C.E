import Section from "@/components/layout/Section";
import {
  useAccessiblePatients,
  usePrimaryPatientId,
  useSetActivePatient,
} from "@/src/api/medications/hooks";
import AppText from "@/src/components/AppText";
import Loading from "@/src/components/Loading";
import Card from "@/src/components/layout/Card";
import Screen from "@/src/components/layout/Screen";
import { useAuthStore } from "@/src/state/auth.store";
import { useUIStore } from "@/state/ui.store";
import { theme } from "@/src/theme";
import { router } from "expo-router";
import { CalendarDays, ShieldCheck, UserRound } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

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

export default function PatientProfiles() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showToast } = useUIStore();
  const { data: activePatientId } = usePrimaryPatientId(userId);
  const {
    data: accessiblePatients,
    isLoading,
    refetch: refetchAccessiblePatients,
  } = useAccessiblePatients(userId);
  const setActivePatientMutation = useSetActivePatient(userId);

  if (isLoading && !accessiblePatients) {
    return <Loading />;
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
            <AppText style={styles.sectionHint}>
              {accessiblePatients?.length ?? 0} total
            </AppText>
          </View>

          {!accessiblePatients || accessiblePatients.length === 0 ? (
            <View style={styles.emptyWrap}>
              <AppText style={styles.emptyText}>
                No patient profiles available for this user yet.
              </AppText>
            </View>
          ) : (
            accessiblePatients.map((patient) => {
              const isActive = patient.id === activePatientId || patient.isActive;
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
                          <AppText style={styles.activeBadgeText}>Active</AppText>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.metaRow}>
                      <CalendarDays size={12} color={theme.colors.text.secondary} />
                      <AppText style={styles.metaText}>{formatDob(patient.dob)}</AppText>
                    </View>
                    <AppText style={styles.metaText}>
                      Access Role: {roleLabel(patient.role)}
                    </AppText>
                    <AppText style={styles.viewHintText}>Tap to view profile details</AppText>
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
                        <AppText weight="semibold" style={styles.setActiveBtnText}>
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
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
});
