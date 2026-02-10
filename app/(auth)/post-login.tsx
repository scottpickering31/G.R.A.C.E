import Loading from "@/components/Loading";
import { useIsOnboardingCompleted } from "@/src/api/onboarding/hooks";
import { useAuthStore } from "@/src/state/auth.store";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function PostLoginGate() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;

  const {
    data: completed,
    isLoading,
    isError,
    error,
  } = useIsOnboardingCompleted(userId);

  useEffect(() => {
    if (!userId) return;
    if (isLoading) return;

    if (isError) {
      console.log("Onboarding check error:", error);
      return;
    }

    if (!completed) {
      router.replace("/(onboarding)");
      return;
    }

    router.replace("/(tabs)");
  }, [userId, completed, isLoading, isError, error, router]);

  return (
    <View style={{ flex: 1 }}>
      <Loading />
    </View>
  );
}
