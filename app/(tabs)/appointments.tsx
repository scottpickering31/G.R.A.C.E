import PillButton from "@/components/buttons/PillButton";
import Card from "@/components/layout/Card";
import Screen from "@/components/layout/Screen";
import Section from "@/components/layout/Section";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AppText from "@/src/components/AppText";
import CollapsibleCalendar from "@/src/components/calendar/CollapsibleCalendar";
import { theme } from "@/src/theme";
import { colors } from "@/styles/shared-styles";
import { Calendar1, ChevronRight, HeartPulse } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function Appointments() {
  const [date, setDate] = useState(new Date());
  return (
    <Screen>
      <Section>
        <View style={styles.headerContainer}>
          <ProfileHeader style={{ width: "60%" }} />
          <PillButton
            label="Add Event"
            Icon={Calendar1}
            RightIcon={ChevronRight}
            iconColor={colors.brand.primary}
            showIconChip={true}
            rightIconColor={colors.brand.primary}
            textStyle={{
              color: "#4A90E2",
              fontSize: theme.typography.fontSize.sm,
              fontWeight: "600",
            }}
            iconSize={20}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              width: "40%",
            }}
            onPress={() => {}}
          />
        </View>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText style={{ fontSize: theme.typography.fontSize.md }}>
            Track all key events and milestones.
          </AppText>
        </Card>
        <Card padding="none" borderActive={true} elevationActive={true}>
          <CollapsibleCalendar value={date} onChange={setDate} />
        </Card>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <View>
            <HeartPulse size={20} color="#1F2937" />
            <AppText>View Timeline</AppText>
            <ChevronRight size={20} color="#1F2937" />
          </View>
        </Card>
        <AppText>Sunday, April 20 Today</AppText>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText>Paediatric Appointment</AppText>
          <AppText>Paediatric Appointment</AppText>
          <AppText>Paediatric Appointment</AppText>
        </Card>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText>Katies 6th surgery: G-Tube placed</AppText>
        </Card>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText>OT Therapy Session</AppText>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
