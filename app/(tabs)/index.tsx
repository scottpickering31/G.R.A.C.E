import PillButton from "@/components/buttons/PillButton";
import Card from "@/components/layout/Card";
import ListBlock from "@/components/layout/ListBlock";
import Screen from "@/components/layout/Screen";
import Section from "@/components/layout/Section";
import {
  usePrimaryPatientId,
  useUpcomingMedicationDoses,
} from "@/src/api/medications/hooks";
import AppText from "@/src/components/AppText";
import CurrentTime from "@/src/components/calendar/CurrentTime";
import MedsDueModal, {
  MedsDueWindowHours,
  UpcomingMedication,
} from "@/src/components/medications/MedsDueModal";
import SwipeableTabScreen from "@/src/components/navigation/SwipeableTabScreen";
import ProfileHeader from "@/src/components/profile/ProfileHeader";
import { useAuthStore } from "@/src/state/auth.store";
import { theme } from "@/src/theme";
import { colors } from "@/styles/shared-styles";
import { router } from "expo-router";
import {
  AlertTriangle,
  BriefcaseMedical,
  CalendarClock,
  ChevronRight,
  Clock,
  Plus,
  Package,
  Pill,
  ScanFace,
} from "lucide-react-native";
import { useState } from "react";
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

export default function Dashboard() {
  const [showMedsDue, setShowMedsDue] = useState(false);
  const [medsWindowHours, setMedsWindowHours] =
    useState<MedsDueWindowHours>(24);
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: primaryPatientId, refetch: refetchPrimaryPatient } =
    usePrimaryPatientId(userId);
  const { data: upcomingMedsData, refetch: refetchUpcomingMeds } =
    useUpcomingMedicationDoses(primaryPatientId ?? undefined, medsWindowHours);
  const sortedMeds: UpcomingMedication[] = upcomingMedsData ?? [];
  const nextDue = sortedMeds[0];
  const nextDueLabel = nextDue
    ? format24HourWithMeridiem(nextDue.dueAt)
    : "No medications due";
  const medsDueSubtitle = nextDue
    ? `${nextDue.name} - ${nextDue.dose}`
    : "No medications due";
  const medsWindowLabel =
    medsWindowHours === 1
      ? "Next hour"
      : medsWindowHours === 24
        ? "Next 24 hours"
        : "Next 7 days";

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
          }}
        >
          <View style={styles.headerRow}>
            <ProfileHeader />
            <PillButton
              label="Add Profile"
              Icon={ScanFace}
              RightIcon={ChevronRight}
              iconColor={colors.brand.primary}
              showIconChip={true}
              rightIconColor={colors.brand.primary}
              iconSize={20}
              textStyle={{
                color: "#4A90E2",
                fontSize: theme.typography.fontSize.sm,
                fontWeight: "600",
              }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 7,
                width: "44%",
                alignSelf: "center",
              }}
              onPress={() => {}}
            />
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
              {medsDueSubtitle}
            </AppText>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaChip}>
                <Clock size={14} color={theme.colors.brand.dark} />
                <AppText style={styles.heroMetaText}>{nextDueLabel}</AppText>
              </View>
              <View style={styles.heroMetaChip}>
                <Pill size={14} color={theme.colors.brand.dark} />
                <AppText style={styles.heroMetaText}>{medsWindowLabel}</AppText>
              </View>
            </View>
          </Card>

          <View style={styles.quickMetricsRow}>
            <Card
              elevationActive={true}
              borderActive={true}
              padding="md"
              style={styles.metricCard}
            >
              <AppText style={styles.metricLabel}>Due Now</AppText>
              <AppText weight="bold" style={styles.metricValue}>
                {sortedMeds.length}
              </AppText>
              <AppText style={styles.metricSubLabel}>Medications</AppText>
            </Card>

            <Card
              elevationActive={true}
              borderActive={true}
              padding="md"
              style={styles.metricCard}
            >
              <AppText style={styles.metricLabel}>Current Time</AppText>
              <View style={styles.timeRow}>
                <Clock size={14} color="#4A90E2" />
                <CurrentTime />
              </View>
              <AppText style={styles.metricSubLabel}>Live</AppText>
            </Card>

            <Card
              elevationActive={true}
              borderActive={true}
              padding="md"
              style={styles.metricCard}
            >
              <AppText style={styles.metricLabel}>Stock</AppText>
              <AppText weight="bold" style={styles.metricValue}>
                Track
              </AppText>
              <Pressable onPress={() => router.push("/stock")}>
                <AppText style={styles.metricLink}>Open</AppText>
              </Pressable>
            </Card>
          </View>

          <Card elevationActive={true} borderActive={true} padding={"md"}>
            <View style={styles.sectionTitleRow}>
              <AppText style={styles.sectionTitle}>Priority Queue</AppText>
              <Pressable style={styles.miniAction}>
                <Plus size={14} color={theme.colors.brand.dark} />
                <AppText style={styles.miniActionText}>Add Item</AppText>
              </Pressable>
            </View>
            <Card elevationActive={false} borderActive={false} padding={"none"}>
              <View>
                <ListBlock
                  Icon={Pill}
                  iconBgColor="rgba(74, 144, 226, 0.18)"
                  title={`Meds Due (${medsWindowLabel})`}
                  subtitle={medsDueSubtitle}
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
                  subtitle="Tap to review today's schedule"
                  rightText="Open"
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
  timeRow: {
    marginTop: 4,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
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
