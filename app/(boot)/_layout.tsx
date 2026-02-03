import { Stack } from "expo-router";
import React from "react";

export default function BootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="publisher" />
      <Stack.Screen name="splash" />
    </Stack>
  );
}
