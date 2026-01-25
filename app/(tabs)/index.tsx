import PillButton from "@/components/buttons/PillButton";
import Card from "@/components/layout/Card";
import ListBlock from "@/components/layout/ListBlock";
import Screen from "@/components/layout/Screen";
import Section from "@/components/layout/Section";
import ProfileHeader from "@/src/components/profile/ProfileHeader";
import { colors } from "@/styles/shared-styles";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Dashboard() {
  return (
    <Screen>
      <Section>
        <View style={styles.headerContainer}>
          <ProfileHeader />
          <PillButton
            label="Add Profile"
            iconName="person-add-outline"
            iconColor={colors.brand.primary}
            showIconChip={true}
            rightIconColor={colors.brand.primary}
            textStyle={{ color: "#4A90E2", fontSize: 15 }}
            iconSize={20}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 5,
              width: 145,
              alignSelf: "center",
            }}
            onPress={() => {}}
          />
        </View>
        <Card elevationActive={true} borderActive={true} padding="lg">
          <Text>
            <Text style={{ fontWeight: "700" }}>Welcome back!</Text> Here’s a
            look at today’s schedule:
          </Text>
        </Card>

        <Card elevationActive={true} borderActive={true} padding={"md"}>
          <Text style={{ fontWeight: "500" }}>Todays Overview:</Text>
          <Card elevationActive={false} borderActive={false} padding={"none"}>
            <View>
              <ListBlock
                iconName="medical-outline"
                iconBgColor="rgba(74, 144, 226, 0.18)"
                title="Meds Due"
                subtitle="Next: 10:00 AM"
                rightText="3 Medications"
                rightTextStyles={{
                  fontWeight: "500",
                }}
                rightTextContainer={{
                  borderRadius: 45,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: colors.bg.danger,
                }}
                showChevron={false}
                onPress={() => {
                  return null;
                }}
              />

              <ListBlock
                iconName="calendar-outline"
                iconBgColor="rgba(126, 200, 160, 0.22)"
                title="Appointments"
                subtitle="Speech Therapy"
                rightText="1:00 PM"
                onPress={() => router.push("/appointments")}
              />

              <ListBlock
                iconName="checkbox-outline"
                iconBgColor="rgba(245, 193, 108, 0.25)"
                title="Tasks"
                subtitle="2 Tasks"
                onPress={() => router.push("/(pages)/tasks")}
              />

              <ListBlock
                iconName="alert-circle-outline"
                iconBgColor="rgba(233, 107, 107, 0.22)"
                iconColor={colors.semantic.danger}
                title="Alerts"
                subtitle="Insulin dose deviation"
                rightText="View all"
                rightTextStyles={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  fontWeight: "500",
                }}
                rightTextContainer={{
                  borderRadius: 45,
                  backgroundColor: colors.bg.info,
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
            iconName="medkit"
            iconColor="white"
            iconSize={25}
            rightIconName="chevron-forward"
            textStyle={{
              color: "white",
              fontWeight: "500",
              textAlign: "center",
            }}
            style={{ backgroundColor: "red", width: "60%" }}
          />
          <Text>Tap for critical info and lock phone</Text>
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
