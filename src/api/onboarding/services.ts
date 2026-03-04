import { supabase } from "@/services/supabase";

export async function setOnboardingCompleted(userId: string) {
  const onboardingCompletedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: onboardingCompletedAt })
    .eq("id", userId)
    .select("id, onboarding_completed_at")
    .single();

  if (!error) return data;
  if (error.code !== "PGRST116") throw error;

  // Fallback for brand new users when no profile row exists yet.
  const { data: upsertedData, error: upsertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        onboarding_completed_at: onboardingCompletedAt,
      },
      { onConflict: "id" },
    )
    .select("id, onboarding_completed_at")
    .single();

  if (upsertError) throw upsertError;
  return upsertedData;
}

export async function isOnboardingCompleted(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  // Real errors should still throw
  if (error) throw error;

  // If the row doesn't exist yet -> treat as not completed
  if (!data) return false;

  return !!data.onboarding_completed_at;
}
