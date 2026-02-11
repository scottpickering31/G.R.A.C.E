// src/api/onboarding/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isOnboardingCompleted, setOnboardingCompleted } from "./services";

export function useSetOnboardingCompleted() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => setOnboardingCompleted(userId),
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: ["onboarding-completed", userId] });
    },
  });
}

export function useIsOnboardingCompleted(userId?: string) {
  return useQuery({
    queryKey: ["onboarding-completed", userId],
    queryFn: () => isOnboardingCompleted(userId!),
    enabled: !!userId,

    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
}
