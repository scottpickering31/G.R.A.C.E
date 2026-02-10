import { useSetOnboardingCompleted } from "@/src/api/onboarding/hooks";
import AppText from "@/src/components/AppText";
import { useAuthStore } from "@/src/state/auth.store";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

export default function Complete() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;

  const { mutate, isPending, isError, error } = useSetOnboardingCompleted();

  const handleClick = () => {
    if (!userId || isPending) return;

    mutate(userId, {
      onSuccess: () => router.replace("/(tabs)"),
    });
  };

  return (
    <View>
      <Text>Thank you for completing!</Text>

      {isError ? <Text>{String(error?.message ?? error)}</Text> : null}

      <Pressable onPress={handleClick} disabled={!userId || isPending}>
        <AppText>{isPending ? "Saving..." : "Completed"}</AppText>
      </Pressable>
    </View>
  );
}
