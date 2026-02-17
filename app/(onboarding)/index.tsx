import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import { GradientText } from "@/src/components/layout/LinearGradientText";
import Screen from "@/src/components/layout/Screen";
import { theme } from "@/src/theme";
import { useRouter } from "expo-router";
import { FileText, HeartPulse, ShieldCheck } from "lucide-react-native";
import React from "react";
import { Image, Pressable, View } from "react-native";

export default function Welcome() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/(auth)/signup");
  };

  const valueProps = [
    {
      label: "Track Emergencies in Seconds",
      subtitle: "Quick logging, timers, and patterns over time.",
      Icon: HeartPulse,
    },
    {
      label: "Build a Care Plan",
      subtitle: "Rescue steps, triggers, meds, and notes when you need them.",
      Icon: ShieldCheck,
    },
    {
      label: "Share Clear Reports",
      subtitle: "Export summaries for doctors, school, or caregivers.",
      Icon: FileText,
    },
  ];

  return (
    <Screen
      useSafeArea={true}
      screenBackground={require("@/assets/images/welcome-dreamscape.png")}
      contentStyle={{ zIndex: 1 }}
    >
      <View style={{ padding: 8 }}>
        <GradientText
          colors={["#63D6C5", "#8A76FF"]}
          style={{
            fontSize: theme.typography.fontSize["2xl"],
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          Welcome to G.R.A.C.E
        </GradientText>
        <AppText
          style={{
            marginTop: 5,
            fontSize: theme.typography.fontSize["xl"],
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          Support for calmer, safer care.
        </AppText>

        <AppText
          style={{
            marginTop: 5,
            fontSize: theme.typography.fontSize.md,
            fontWeight: "600",
            textAlign: "center",
            opacity: 0.9,
          }}
        >
          Here&apos;s what you&apos;ll be able to do inside the app.
        </AppText>
      </View>

      <Image
        source={require("@/assets/images/welcome-parents.png")}
        style={{ width: "100%", height: "35%" }}
      />

      <View style={{ gap: 5, paddingHorizontal: 10 }}>
        {valueProps.map((item) => (
          <PillButton
            key={item.label}
            label={item.label}
            subtitle={item.subtitle}
            Icon={item.Icon}
            elevationActive={false}
            iconColor="purple"
            showIconChip={true}
            iconSize={30}
            textContainerStyle={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
            textStyle={{
              fontWeight: "700",
              fontSize: theme.typography.fontSize.lg,
            }}
            subtitleStyle={{ width: "80%", textAlign: "center" }}
            style={{
              justifyContent: "space-evenly",
              backgroundColor: "rgba(255, 228, 255, 0.5)",
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
        <PillButton
          label="Get Started"
          onPress={handleClick}
          gradientColors={["#63D6C5", "#8A76FF"]}
          borderActive={false}
          elevationActive={true}
          textStyle={{ color: "white", fontWeight: "800", fontSize: 18 }}
          style={{ minHeight: 56, paddingVertical: 16 }}
          textContainerStyle={{ alignItems: "center" }}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 5,
            marginTop: 10,
          }}
        >
          <AppText>Already have an account? </AppText>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <AppText style={{ color: "#8A76FF", fontWeight: "600" }}>
              Login
            </AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
