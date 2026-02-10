import AppText from "@/src/components/AppText";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

export default function CreatePatientProfile() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/(onboarding)/permissions");
  };

  return (
    <View>
      <Text>Create your first patient profile</Text>
      <Pressable onPress={handleClick}>
        <AppText>Next</AppText>
      </Pressable>
    </View>
  );
}
