import PillButton from "@/components/buttons/PillButton";
import Card from "@/components/layout/Card";
import ListBlock from "@/components/layout/ListBlock";
import Screen from "@/components/layout/Screen";
import Section from "@/components/layout/Section";
import AppText from "@/src/components/AppText";
import CurrentTime from "@/src/components/calendar/CurrentTime";
import ProfileHeader from "@/src/components/profile/ProfileHeader";
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
import { View } from "react-native";

export default function Dashboard() {
  return (
    <Screen>
      <Section>
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
                title="Meds Due"
                subtitle="Next: 10:00 AM"
                rightText="3 Medications"
                rightTextContainer={{
                  backgroundColor: theme.colors.bg.skyMid,
                }}
                onPress={() => {
                  return null;
                }}
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
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae
            sunt ab sequi sapiente, nobis a minus! Aliquam eligendi quibusdam
            aperiam, voluptatibus cumque distinctio doloribus mollitia obcaecati
            asperiores suscipit provident modi.
          </AppText>
        </Card>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae
            sunt ab sequi sapiente, nobis a minus! Aliquam eligendi quibusdam
            aperiam, voluptatibus cumque distinctio doloribus mollitia obcaecati
            asperiores suscipit provident modi.
          </AppText>
        </Card>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae
            sunt ab sequi sapiente, nobis a minus! Aliquam eligendi quibusdam
            aperiam, voluptatibus cumque distinctio doloribus mollitia obcaecati
            asperiores suscipit provident modi.
          </AppText>
        </Card>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae
            sunt ab sequi sapiente, nobis a minus! Aliquam eligendi quibusdam
            aperiam, voluptatibus cumque distinctio doloribus mollitia obcaecati
            asperiores suscipit provident modi.
          </AppText>
        </Card>
      </Section>
    </Screen>
  );
}
