import AppText from "@/src/components/AppText";
import { router } from "expo-router";
import { Pressable } from "react-native";

export default function AboutUs() {
  const handleClick = () => {
    router.replace("/(onboarding)/create-patient-profile");
  };
  return (
    <Pressable onPress={handleClick} style={{ padding: 104 }}>
      <AppText>AboutUs</AppText>
    </Pressable>
  );
}
