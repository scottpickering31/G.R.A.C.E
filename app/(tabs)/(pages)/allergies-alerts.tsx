import AppText from "@/src/components/AppText";
import Section from "@/src/components/layout/Section";
import { useAuthStore } from "@/src/state/auth.store";
import { router } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

export default function AllergiesAlerts() {
  const { signOut } = useAuthStore();

  // TEST
  const handlePress = () => {
    signOut();
    console.log("Signing Out");
    router.replace("/(auth)/login");
  };
  return (
    <Section>
      <AppText>AllergiesAlerts</AppText>
      <Pressable onPress={handlePress}>
        <AppText>Sign Out</AppText>
      </Pressable>
    </Section>
  );
}
