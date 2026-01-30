import { Stack } from "expo-router";
import React from "react";

export default function BootLayout() {
  return (
    <Stack>
      <Stack.Screen name="publisher" />
      <Stack.Screen name="splash" />
    </Stack>
  );
}
