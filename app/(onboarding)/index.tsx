import AppText from "@/src/components/AppText";
import { useRouter } from "expo-router";
import React from "react";
import { ImageBackground, Pressable } from "react-native";

export default function Welcome() {
  const router = useRouter();

  const handleClick = () => {
    router.replace("./(onboarding)/create-patient-profile");
  };

  return (
    <ImageBackground source={require("@/assets/images/welcome-dreamscape.png")}>
      <AppText>Welcome!</AppText>
      <Pressable onPress={handleClick}>
        <AppText>Create Patient Profile Here</AppText>
      </Pressable>
    </ImageBackground>
  );
}
