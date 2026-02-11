import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import Screen from "@/src/components/layout/Screen";
import { useRouter } from "expo-router";
import { Circle, Cog, HeartPlus, UserPen } from "lucide-react-native";
import React from "react";
import { Image, View } from "react-native";

export default function Welcome() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/(onboarding)/about-us");
  };

  return (
    <Screen
      screenBackground={require("@/assets/images/welcome-dreamscape.png")}
      contentStyle={{ marginTop: 40, zIndex: 1 }}
    >
      <View>
        <AppText
          style={{ fontSize: 48, fontWeight: "800", textAlign: "center" }}
        >
          Welcome!
        </AppText>
        <AppText
          style={{ fontSize: 24, fontWeight: "600", textAlign: "center" }}
        >
          We are glad to have you here.
        </AppText>
        <AppText
          style={{ fontSize: 24, fontWeight: "600", textAlign: "center" }}
        >
          Let&apos;s get started with a few quick steps to set up your G.R.A.C.E
          experience
        </AppText>
      </View>
      <Image
        source={require("@/assets/images/welcome-parents.png")}
        style={{ width: "100%", height: "40%" }}
      />

      <View style={{ gap: 5 }}>
        <PillButton
          label="Personalise Your Profile"
          subtitle="Add your photo and basic info."
          Icon={UserPen}
          RightIcon={Circle}
          style={{ justifyContent: "space-evenly" }}
        />
        <PillButton
          label="Add a Patient Profile"
          subtitle="Create a profile for a patient you care for."
          Icon={HeartPlus}
          RightIcon={Circle}
          style={{ justifyContent: "space-evenly" }}
        />

        <PillButton
          label="Set Up Your Preferences"
          subtitle="Choose interests, notifications and more."
          Icon={Cog}
          RightIcon={Circle}
          style={{ justifyContent: "space-evenly" }}
        />
      </View>
      <View>
        <PillButton onPress={handleClick} label="Get Started" />
      </View>
    </Screen>
  );
}
