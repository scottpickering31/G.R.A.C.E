import AppText from "@/src/components/AppText";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

export default function Permissions() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/(onboarding)/complete");
  };

  return (
    <View>
      <Text>Thank you for permissions!</Text>
      <Pressable onPress={handleClick}>
        <AppText>Complete now</AppText>
      </Pressable>
    </View>
  );
}
