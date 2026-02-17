import { supabase } from "@/services/supabase";

export async function setOnboardingCompleted(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", userId)
    .select("onboarding_completed_at")
    .single();

  if (error) throw error;
  return data;
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
