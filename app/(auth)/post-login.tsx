import {
  useHasPatientAccess,
  useIsOnboardingCompleted,
} from "@/src/api/onboarding/hooks";
import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import DashboardSkeleton from "@/src/components/loading/DashboardSkeleton";
import { theme } from "@/src/theme";
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
    isLoading: onboardingLoading,
    isError: onboardingError,
    error: onboardingErrorObj,
    refetch: refetchOnboarding,
  } = useIsOnboardingCompleted(userId);
  const {
    data: hasPatient,
    isLoading: patientLoading,
    isError: patientError,
    error: patientErrorObj,
    refetch: refetchPatient,
  } = useHasPatientAccess(userId);

  useEffect(() => {
    if (!hydrated) return;

    if (!session) {
      router.replace("/(onboarding)");
      return;
    }

    if (onboardingLoading || patientLoading || onboardingError || patientError) return;

    if (!hasPatient) {
      router.replace("/(onboarding)/create-patient-profile");
      return;
    }

    if (!completed) {
      router.replace("/(onboarding)/permissions");
      return;
    }

    router.replace("/(tabs)");
  }, [
    hydrated,
    session,
    onboardingLoading,
    patientLoading,
    onboardingError,
    patientError,
    hasPatient,
    completed,
    router,
  ]);

  if (!hydrated || onboardingLoading || patientLoading) {
    return <DashboardSkeleton />;
  }

  if (onboardingError || patientError) {
    const message = onboardingErrorObj?.message ?? patientErrorObj?.message;

    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
        <AppText
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          We couldn’t check your account right now.
        </AppText>
        <AppText style={{ textAlign: "center", opacity: 0.7 }}>
          Please check your connection and try again.
        </AppText>
        <AppText>{message}</AppText>
        <PillButton
          label="Retry"
          onPress={() => {
            refetchOnboarding();
            refetchPatient();
          }}
          gradientColors={["#63D6C5", "#8A76FF"]}
          borderActive={false}
          textStyle={{ color: "white", fontWeight: "800" }}
          textContainerStyle={{ alignItems: "center" }}
          style={{ minHeight: 56, paddingVertical: 16 }}
        />
      </View>
    );
  }

  return <DashboardSkeleton />;
}
