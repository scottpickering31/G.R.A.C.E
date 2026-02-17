import Section from "@/components/layout/Section";
import AppText from "@/src/components/AppText";
import Card from "@/src/components/layout/Card";
import ListBlock from "@/src/components/layout/ListBlock";
import Screen from "@/src/components/layout/Screen";
import ProfileHeader from "@/src/components/profile/ProfileHeader";
import {
  AlarmClock,
  AlertCircle,
  Bandage,
  CalendarCheck,
  ChevronRight,
  Pill,
  PillBottle,
  Plus,
  Syringe,
  Tablets,
} from "lucide-react-native";
import { View } from "react-native";

export default function MedicationsTreatments() {
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
        <Card elevationActive={true} borderActive={true} padding={"md"}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <AlarmClock size={20} color="#1F2937" />
            <AppText style={{ fontWeight: "500" }}>Timed Reminders</AppText>
            <AppText>
              2 reminders today
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: "#E95A5A",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertCircle size={16} color="#fff" />
              </View>
              <ChevronRight size={16} color="#1F2937" />
            </AppText>
          </View>
          <Card elevationActive={false} borderActive={false} padding={"none"}>
            <View>
              <ListBlock
                Icon={PillBottle}
                iconBgColor="rgba(74, 144, 226, 0.18)"
                title="Meds Due"
                subtitle="Next: 10:00 AM"
                rightText="3 Medications"
                showChevron={false}
                onPress={() => {}}
              />
              <ListBlock
                Icon={Pill}
                iconBgColor="rgba(74, 144, 226, 0.18)"
                title="Meds Due"
                subtitle="Next: 10:00 AM"
                rightText="3 Medications"
                showChevron={false}
                onPress={() => {}}
              />
              <Plus size={20} color="#1F2937" />
              <AppText>Add Medication</AppText>
            </View>
          </Card>
        </Card>
        <Card padding="lg" borderActive={true} elevationActive={true}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <CalendarCheck size={20} color="#1F2937" />
            <AppText style={{ fontWeight: "500" }}>Medications</AppText>
            <ChevronRight size={16} color="#1F2937" />
          </View>
          <ListBlock
            Icon={Bandage}
            iconBgColor="rgba(74, 144, 226, 0.18)"
            title="Meds Due"
            subtitle="Next: 10:00 AM"
            rightText="3 Medications"
            showChevron={false}
            onPress={() => {}}
          />
          <ListBlock
            Icon={Syringe}
            iconBgColor="rgba(74, 144, 226, 0.18)"
            title="Meds Due"
            subtitle="Next: 10:00 AM"
            rightText="3 Medications"
            showChevron={false}
            onPress={() => {}}
          />
          <ListBlock
            Icon={Tablets}
            iconBgColor="rgba(74, 144, 226, 0.18)"
            title="Meds Due"
            subtitle="Next: 10:00 AM"
            rightText="3 Medications"
            showChevron={false}
            onPress={() => {}}
          />
        </Card>
      </Section>
    </Screen>
  );
}
