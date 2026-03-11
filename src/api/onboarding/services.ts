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

export async function hasPatientAccess(userId: string) {
  const { data: memberships, error: membershipsError } = await supabase
    .from("patient_members")
    .select("patient_id,role")
    .eq("user_id", userId);

  if (membershipsError) throw membershipsError;
  if (!memberships || memberships.length === 0) return false;

  const ownerAccess = memberships.some((membership) => membership.role === "owner");
  if (ownerAccess) return true;

  const { data: approvedRequests, error: approvedRequestsError } = await supabase
    .from("patient_access_requests" as any)
    .select("patient_id,requested_role")
    .eq("requester_user_id", userId)
    .eq("status", "approved");

  if (approvedRequestsError) throw approvedRequestsError;

  const approvedMembershipKeys = new Set<string>(
    (approvedRequests ?? []).map(
      (row: any) => `${row.patient_id}:${row.requested_role}`,
    ),
  );

  return memberships.some((membership) =>
    approvedMembershipKeys.has(`${membership.patient_id}:${membership.role}`),
  );
}
