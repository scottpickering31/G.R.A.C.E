import PillButton from "@/components/buttons/PillButton";
import Card from "@/components/layout/Card";
import Screen from "@/components/layout/Screen";
import Section from "@/components/layout/Section";
import ProfileHeader from "@/components/profile/ProfileHeader";
import CollapsibleCalendar from "@/src/components/calendar/CollapsibleCalendar";
import { colors } from "@/styles/shared-styles";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Appointments() {
  const [date, setDate] = useState(new Date());
  return (
    <Screen>
      <Section>
        <View style={styles.headerContainer}>
          <ProfileHeader />
          <PillButton
            label="Add Event"
            iconName="calendar"
            iconColor={colors.brand.primary}
            showIconChip={true}
            rightIconColor={colors.brand.primary}
            textStyle={{ color: "#4A90E2", fontSize: 17 }}
            iconSize={20}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              width: 160,
            }}
            onPress={() => {}}
          />
        </View>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <Text>Track all key events and milestones</Text>
        </Card>
        <Card padding="none" borderActive={true} elevationActive={true}>
          <CollapsibleCalendar value={date} onChange={setDate} />
        </Card>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <Text>View Timeline</Text>
        </Card>
        <Text>Sunday, April 20 ------- Today</Text>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <Text>Paediatric Appointment</Text>
          <Text>Paediatric Appointment</Text>
          <Text>Paediatric Appointment</Text>
        </Card>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <Text>Katies 6th surgery: G-Tube placed</Text>
        </Card>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <Text>OT Therapy Session</Text>
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
