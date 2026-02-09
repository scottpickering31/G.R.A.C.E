import { theme } from "@/src/theme";
import { CalendarDays, ChevronDown } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";

export default function ProfileSwitcher() {
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
            Katie
          </AppText>
          <ChevronDown style={{ marginTop: 5, marginLeft: 5 }} />
        </View>
        <View style={styles.container}>
          <CalendarDays size={18} />
          <AppText style={{ fontSize: theme.typography.fontSize.sm }}>
            Age: 5
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
