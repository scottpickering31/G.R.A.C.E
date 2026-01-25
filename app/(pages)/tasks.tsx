import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

export default function Task1() {
  return (
    <View>
      <Text>Task1</Text>
      <Text>Task2</Text>
      <Text>Task3</Text>
      <Pressable onPress={router.back}>
        <Text>Close</Text>
      </Pressable>
    </View>
  );
}
