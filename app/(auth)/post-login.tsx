import Loading from "@/components/Loading";
import { useIsOnboardingCompleted } from "@/src/api/onboarding/hooks";
import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import { useAuthStore } from "@/src/state/auth.store";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function PostLoginGate() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const userId = session?.user.id;

  const {
    data: completed,
    isLoading,
    isError,
    error,
    refetch,
  } = useIsOnboardingCompleted(userId);

  console.log("POSTLOGIN", {
    hydrated,
    hasSession: !!session,
    userId: session?.user?.id,
    completed,
    isLoading,
    isError,
  });

  useEffect(() => {
    if (!hydrated) return;

    if (!session) {
      router.replace("/(onboarding)");
      return;
    }

    if (isLoading || isError) return;

    if (!completed) {
      router.replace("/(onboarding)/create-patient-profile");
      return;
    }

    router.replace("/(tabs)");
  }, [hydrated, session, isLoading, isError, completed, router]);

  if (!hydrated || isLoading) return <Loading />;

  if (isError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
        <AppText
          style={{ fontSize: 18, fontWeight: "800", textAlign: "center" }}
        >
          We couldn’t check your account right now.
        </AppText>
        <AppText style={{ textAlign: "center", opacity: 0.7 }}>
          Please check your connection and try again.
        </AppText>
        <AppText>{error.message}</AppText>
        <PillButton
          label="Retry"
          onPress={() => refetch()}
          gradientColors={["#63D6C5", "#8A76FF"]}
          borderActive={false}
          textStyle={{ color: "white", fontWeight: "800" }}
          textContainerStyle={{ alignItems: "center" }}
          style={{ minHeight: 56, paddingVertical: 16 }}
        />
      </View>
    );
  }

  return <Loading />;
}
