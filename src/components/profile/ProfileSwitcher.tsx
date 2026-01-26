import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ProfileSwitcher() {
  return (
    <View style={styles.textContainer}>
      <View style={styles.container}>
        <Text style={{ fontWeight: "500", fontSize: 16 }}>Katie</Text>
        <Ionicons name="chevron-down" />
      </View>
      <View style={styles.container}>
        <Ionicons name="at-circle" size={18} />
        <Text style={{ fontSize: 14 }}>Age: 5</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  textContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
