// src/api/onboarding/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isOnboardingCompleted, setOnboardingCompleted } from "./services";

export function useSetOnboardingCompleted() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => setOnboardingCompleted(userId),
    onSuccess: () => {
      // refresh anything that depends on profile
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useIsOnboardingCompleted(userId?: string) {
  return useQuery({
    queryKey: ["onboarding-completed", userId],
    queryFn: () => isOnboardingCompleted(userId!),
    enabled: !!userId,
  });
}
