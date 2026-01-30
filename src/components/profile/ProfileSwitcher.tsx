import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ProfileSwitcher() {
  return (
    <View style={styles.textContainer}>
      <Pressable
        onPress={() => {
          console.log("This will open Profile Chooser dropdown");
        }}
      >
        <View style={styles.container}>
          <Text style={{ fontWeight: "500", fontSize: 20 }}>Katie</Text>
          <Ionicons
            name="chevron-down"
            style={{ marginTop: 5, marginLeft: 5 }}
          />
        </View>
        <View style={styles.container}>
          <Ionicons name="at-circle" size={18} />
          <Text style={{ fontSize: 16 }}>Age: 5</Text>
        </View>
      </Pressable>
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
