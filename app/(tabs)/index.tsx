import PillButton from "@/components/buttons/PillButton";
import Card from "@/components/layout/Card";
import ListBlock from "@/components/layout/ListBlock";
import Screen from "@/components/layout/Screen";
import Section from "@/components/layout/Section";
import {
  useMedications,
  usePrimaryPatientId,
  useUpcomingMedicationDoses,
} from "@/src/api/medications/hooks";
import { useAppointments } from "@/src/api/appointments/hooks";
import AppText from "@/src/components/AppText";
import CurrentTime from "@/src/components/calendar/CurrentTime";
import MedsDueModal, {
  MedsDueWindowHours,
  UpcomingMedication,
} from "@/src/components/medications/MedsDueModal";
import SwipeableTabScreen from "@/src/components/navigation/SwipeableTabScreen";
import ProfileHeader from "@/src/components/profile/ProfileHeader";
import { useAuthStore } from "@/src/state/auth.store";
import { useUIStore } from "@/src/state/ui.store";
import { theme } from "@/src/theme";
import { colors } from "@/styles/shared-styles";
import { router } from "expo-router";
import {
  AlertTriangle,
  BriefcaseMedical,
  CalendarClock,
  ChevronRight,
  Clock,
  Package,
  Pill,
} from "lucide-react-native";
import { useMemo, useState } from "react";
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

function getHomeStockLevel(med: {
  stock_quantity: number | null;
  low_stock_threshold: number | null;
}) {
  const qty = med.stock_quantity;
  const threshold = med.low_stock_threshold;

  if (qty == null) return "unset" as const;
  if (qty <= 0) return "critical" as const;
  if (threshold != null) {
    if (qty <= threshold) return "critical" as const;
    if (qty <= threshold * 1.5) return "watch" as const;
  }
  return "healthy" as const;
}

export default function Dashboard() {
  const [showMedsDue, setShowMedsDue] = useState(false);
  const medsWindowHours = useUIStore((s) => s.medicationsWindowHours);
  const setMedsWindowHours = useUIStore((s) => s.setMedicationsWindowHours);
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: primaryPatientId, refetch: refetchPrimaryPatient } =
    usePrimaryPatientId(userId);
  const { data: upcomingMedsData, refetch: refetchUpcomingMeds } =
    useUpcomingMedicationDoses(primaryPatientId ?? undefined, medsWindowHours);
  const { data: appointmentsData, refetch: refetchAppointments } =
    useAppointments(primaryPatientId ?? undefined);
  const { data: medicationsData, refetch: refetchMedications } = useMedications(
    primaryPatientId ?? undefined,
  );
  const sortedMeds: UpcomingMedication[] = upcomingMedsData ?? [];
  const upcomingAppointmentsCount = useMemo(() => {
    const now = Date.now();
    const appointments = appointmentsData ?? [];
    return appointments.filter((item) => {
      const startsAtMs = new Date(item.startsAt).getTime();
      return Number.isFinite(startsAtMs) && startsAtMs >= now && !item.completed;
    }).length;
  }, [appointmentsData]);
  const stockStatusLabel = useMemo(() => {
    const medications = medicationsData ?? [];
    const critical = medications.filter(
      (med) => getHomeStockLevel(med) === "critical",
    ).length;
    if (critical > 0) return `${critical} Critical`;
    const low = medications.filter((med) => getHomeStockLevel(med) === "watch").length;
    if (low > 0) return `${low} Low`;
    return "All Good";
  }, [medicationsData]);
  const nextDue = sortedMeds[0];
  const nextDueLabel = nextDue
    ? format24HourWithMeridiem(nextDue.dueAt)
    : "No medications due";
  const nextDueTitle = nextDue ? nextDue.name : "No medications due";
  const nextDueDose = nextDue ? nextDue.dose : "No dose set";
  const medsDueSubtitle = nextDue
    ? `${nextDue.name} - ${nextDue.dose}`
    : "No medications due";
  return (
    <SwipeableTabScreen activeRoute="/(tabs)">
      <Screen
        screenBackground={require("@/assets/images/clouds.png")}
        useSafeArea={false}
      >
        <Section
          onRefresh={async () => {
            await refetchPrimaryPatient();
            await refetchUpcomingMeds();
            await refetchAppointments();
            await refetchMedications();
          }}
        >
          <View style={styles.headerRow}>
            <ProfileHeader />
          </View>

          <Card
            elevationActive={true}
            borderActive={true}
            padding="md"
            style={styles.heroCard}
          >
            <AppText weight="bold" style={styles.heroTitle}>
              Today&apos;s Care Dashboard
            </AppText>
            <AppText style={styles.heroSubtitle}>
              Next Med Due: <AppText weight="bold">{medsDueSubtitle}</AppText>
            </AppText>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaChip}>
                <Clock size={14} color={theme.colors.brand.dark} />
                <AppText style={styles.heroMetaText}>{nextDueLabel}</AppText>
              </View>
            </View>
          </Card>

          <Card elevationActive={true} borderActive={true} padding={"md"}>
            <View style={styles.sectionTitleRow}>
              <AppText style={styles.sectionTitle}>Today&apos;s Tasks</AppText>
              <View style={styles.tasksTimeChip}>
                <Clock size={14} color={theme.colors.brand.dark} />
                <CurrentTime />
              </View>
            </View>
            <Card elevationActive={false} borderActive={false} padding={"none"}>
              <View>
                <View style={styles.windowSelectorRow}>
                  {(
                    [
                      [1, "Hourly"],
                      [24, "24 Hours"],
                      [168, "7 Days"],
                    ] as [MedsDueWindowHours, string][]
                  ).map(([hours, label]) => {
                    const active = medsWindowHours === hours;
                    return (
                      <Pressable
                        key={hours}
                        style={[
                          styles.windowSelectorChip,
                          active && styles.windowSelectorChipActive,
                        ]}
                        onPress={() => setMedsWindowHours(hours)}
                      >
                        <AppText
                          style={[
                            styles.windowSelectorChipText,
                            active && styles.windowSelectorChipTextActive,
                          ]}
                        >
                          {label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>

                <ListBlock
                  Icon={Pill}
                  iconBgColor="rgba(74, 144, 226, 0.18)"
                  title={nextDueTitle}
                  subtitle={nextDueDose}
                  thirdSubtitle={nextDueLabel}
                  rightText={`${sortedMeds.length} Medications`}
                  rightTextContainer={{
                    backgroundColor: theme.colors.bg.skyMid,
                  }}
                  onPress={() => setShowMedsDue(true)}
                />

                <ListBlock
                  Icon={CalendarClock}
                  iconBgColor="rgba(126, 200, 160, 0.22)"
                  title="Appointments"
                  subtitle="Review today's schedule"
                  rightText={`${upcomingAppointmentsCount} ${
                    upcomingAppointmentsCount === 1 ? "Appointment" : "Appointments"
                  }`}
                  rightTextContainer={{
                    backgroundColor: "rgba(126, 200, 160, 0.22)",
                  }}
                  onPress={() => router.push("/appointments")}
                />

                <ListBlock
                  Icon={Package}
                  iconBgColor="rgba(245, 193, 108, 0.25)"
                  title="Stock"
                  subtitle="Check low supplies and refill status"
                  rightText={stockStatusLabel}
                  rightTextContainer={{
                    backgroundColor: "rgba(245, 193, 108, 0.25)",
                  }}
                  onPress={() => router.push("/stock")}
                />

                <ListBlock
                  Icon={AlertTriangle}
                  iconBgColor="rgba(233, 107, 107, 0.22)"
                  iconColor={colors.semantic.danger}
                  title="Alerts"
                  subtitle="Insulin dose deviation"
                  rightText="View all"
                  rightTextContainer={{
                    backgroundColor: colors.bg.danger,
                  }}
                  onPress={() => {}}
                  showDivider={false}
                />
              </View>
            </Card>
          </Card>

          <Card
            padding="md"
            borderActive={true}
            elevationActive={true}
            style={styles.emergencyCard}
          >
            <PillButton
              label="EMERGENCY"
              rightIconColor="white"
              borderActive={false}
              elevationActive={false}
              showIconChip={false}
              Icon={BriefcaseMedical}
              iconColor="white"
              iconSize={25}
              RightIcon={ChevronRight}
              textStyle={{
                color: "white",
                fontWeight: "700",
                textAlign: "center",
                fontSize: theme.typography.fontSize.lg,
              }}
              style={{ backgroundColor: "#D14343", width: "72%" }}
            />
            <AppText style={styles.emergencySubtitle}>
              Critical information and rapid lock-screen access
            </AppText>
          </Card>

          <Card padding="md" borderActive={true} elevationActive={true}>
            <View style={styles.sectionTitleRow}>
              <AppText style={styles.sectionTitle}>Care Focus Today</AppText>
            </View>
            <View style={styles.focusRow}>
              <Pressable
                style={styles.focusCard}
                onPress={() => router.push("/appointments")}
              >
                <CalendarClock size={16} color={theme.colors.brand.dark} />
                <AppText weight="semibold" style={styles.focusTitle}>
                  Appointments
                </AppText>
                <AppText style={styles.focusSub}>Review timeline</AppText>
              </Pressable>
              <Pressable
                style={styles.focusCard}
                onPress={() => router.push("/stock")}
              >
                <Package size={16} color={theme.colors.brand.dark} />
                <AppText weight="semibold" style={styles.focusTitle}>
                  Inventory
                </AppText>
                <AppText style={styles.focusSub}>Check stock levels</AppText>
              </Pressable>
            </View>
          </Card>

          <MedsDueModal
            visible={showMedsDue}
            onClose={() => setShowMedsDue(false)}
            items={sortedMeds}
            windowHours={medsWindowHours}
            onChangeWindowHours={setMedsWindowHours}
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
    width: "100%",
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
    color: theme.colors.text.primary,
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
  windowSelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  windowSelectorChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  windowSelectorChipActive: {
    borderColor: "rgba(74,144,226,0.24)",
    backgroundColor: "rgba(74,144,226,0.12)",
  },
  windowSelectorChipText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  windowSelectorChipTextActive: {
    color: theme.colors.brand.dark,
  },
  quickMetricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    alignItems: "center",
    minHeight: 96,
  },
  metricLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  metricValue: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.lg,
  },
  metricSubLabel: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  metricLink: {
    marginTop: 3,
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  tasksTimeChip: {
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
  miniAction: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniActionText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  emergencyCard: {
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,244,244,0.92)",
  },
  emergencySubtitle: {
    color: theme.colors.text.secondary,
    textAlign: "center",
    fontSize: theme.typography.fontSize.xs,
  },
  focusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  focusCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.18)",
    backgroundColor: "rgba(234,243,251,0.56)",
    padding: 10,
    gap: 3,
  },
  focusTitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  focusSub: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
});
