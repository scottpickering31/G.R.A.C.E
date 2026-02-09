import AppText from "@/src/components/AppText";
import { router } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

export default function Task1() {
  return (
    <View>
      <AppText>Task1</AppText>
      <AppText>Task2</AppText>
      <AppText>Task3</AppText>
      <Pressable onPress={router.back}>
        <AppText>Close</AppText>
      </Pressable>
    </View>
  );
}
