import { theme } from "@/src/theme";
import { CalendarDays, ChevronDown } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";

type Props = {
  patientName?: string;
  dob?: string | null;
};

function getAgeLabel(dob?: string | null) {
  if (!dob) return "Age: --";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "Age: --";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  if (age < 0) return "Age: --";
  return `Age: ${age}`;
}

export default function ProfileSwitcher({ patientName = "Patient", dob }: Props) {
  return (
    <View style={styles.textContainer}>
      <Pressable
        onPress={() => {
          console.log("This will open Profile Chooser dropdown");
        }}
      >
        <View style={styles.container}>
          <AppText
            style={{
              fontSize: theme.typography.fontSize.lg,
            }}
            weight="bold"
          >
            {patientName}
          </AppText>
          <ChevronDown style={{ marginTop: 5, marginLeft: 5 }} />
        </View>
        <View style={styles.container}>
          <CalendarDays size={18} />
          <AppText style={{ fontSize: theme.typography.fontSize.sm }}>
            {getAgeLabel(dob)}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  textContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
