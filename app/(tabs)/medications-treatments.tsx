import Section from "@/components/layout/Section";
import Card from "@/src/components/layout/Card";
import ListBlock from "@/src/components/layout/ListBlock";
import Screen from "@/src/components/layout/Screen";
import ProfileHeader from "@/src/components/profile/ProfileHeader";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function MedicationsTreatments() {
  return (
    <Screen>
      <Section>
        <ProfileHeader />
        <Card padding="cardInset" borderActive={true} elevationActive={true}>
          <Text>Stay on top of medications and monitor treatments.</Text>
        </Card>
        <Card elevationActive={true} borderActive={true} padding={"md"}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "500" }}>Timed Reminders</Text>
            <Text>
              2 reminders today
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: "#E95A5A",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="alert" color="#fff" />
              </View>
              <Ionicons name="chevron-forward" />
            </Text>
          </View>
          <Card elevationActive={false} borderActive={false} padding={"none"}>
            <View>
              <ListBlock
                iconName="medical-outline"
                iconBgColor="rgba(74, 144, 226, 0.18)"
                title="Meds Due"
                subtitle="Next: 10:00 AM"
                rightText="3 Medications"
                showChevron={false}
                onPress={() => {}}
              />
              <ListBlock
                iconName="medical-outline"
                iconBgColor="rgba(74, 144, 226, 0.18)"
                title="Meds Due"
                subtitle="Next: 10:00 AM"
                rightText="3 Medications"
                showChevron={false}
                onPress={() => {}}
              />
              <Text>Add Medication</Text>
            </View>
          </Card>
        </Card>
        <Card padding="lg" borderActive={true} elevationActive={true}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ fontWeight: "500" }}>Medications</Text>
            <Ionicons name="chevron-forward" />
          </View>
          <ListBlock
            iconName="medical-outline"
            iconBgColor="rgba(74, 144, 226, 0.18)"
            title="Meds Due"
            subtitle="Next: 10:00 AM"
            rightText="3 Medications"
            showChevron={false}
            onPress={() => {}}
          />
          <ListBlock
            iconName="medical-outline"
            iconBgColor="rgba(74, 144, 226, 0.18)"
            title="Meds Due"
            subtitle="Next: 10:00 AM"
            rightText="3 Medications"
            showChevron={false}
            onPress={() => {}}
          />
          <ListBlock
            iconName="medical-outline"
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
