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
  CheckSquare2,
  ChevronRight,
  Clock,
  Pill,
  ScanFace,
} from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <ProfileHeader style={{ width: "57%" }} />
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
                width: "43%",
                alignSelf: "center",
              }}
              onPress={() => {}}
            />
          </View>
          <Card elevationActive={true} borderActive={true} padding="sm">
            <AppText>
              <AppText style={{ fontWeight: "700", textAlign: "center" }}>
                Welcome back!
              </AppText>{" "}
              Here’s a look at today’s schedule:
            </AppText>
          </Card>

          <Card elevationActive={true} borderActive={true} padding={"md"}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <AppText style={{ fontWeight: "700" }}>Todays Overview:</AppText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Clock size={20} color="#4A90E2" />
                <CurrentTime />
              </View>
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
                  subtitle="Speech Therapy"
                  rightText="1:00 PM"
                  rightTextContainer={{
                    backgroundColor: "rgba(126, 200, 160, 0.22)",
                  }}
                  onPress={() => router.push("/appointments")}
                />

                <ListBlock
                  Icon={CheckSquare2}
                  iconBgColor="rgba(245, 193, 108, 0.25)"
                  title="Tasks"
                  subtitle="2 Tasks"
                  onPress={() => router.push("/(pages)/tasks")}
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
            style={{ alignItems: "center", gap: 5 }}
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
              style={{ backgroundColor: "red", width: "60%" }}
            />
            <AppText>Tap for critical info and lock phone</AppText>
          </Card>
          <Card padding="md" borderActive={true} elevationActive={true}>
            <AppText>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Recusandae sunt ab sequi sapiente, nobis a minus! Aliquam eligendi
              quibusdam aperiam, voluptatibus cumque distinctio doloribus
              mollitia obcaecati asperiores suscipit provident modi.
            </AppText>
          </Card>
          <Card padding="md" borderActive={true} elevationActive={true}>
            <AppText>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Recusandae sunt ab sequi sapiente, nobis a minus! Aliquam eligendi
              quibusdam aperiam, voluptatibus cumque distinctio doloribus
              mollitia obcaecati asperiores suscipit provident modi.
            </AppText>
          </Card>
          <Card padding="md" borderActive={true} elevationActive={true}>
            <AppText>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Recusandae sunt ab sequi sapiente, nobis a minus! Aliquam eligendi
              quibusdam aperiam, voluptatibus cumque distinctio doloribus
              mollitia obcaecati asperiores suscipit provident modi.
            </AppText>
          </Card>
          <Card padding="md" borderActive={true} elevationActive={true}>
            <AppText>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Recusandae sunt ab sequi sapiente, nobis a minus! Aliquam eligendi
              quibusdam aperiam, voluptatibus cumque distinctio doloribus
              mollitia obcaecati asperiores suscipit provident modi.
            </AppText>
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
