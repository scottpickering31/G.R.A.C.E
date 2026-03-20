import { supabase } from "@/services/supabase";

export type AccessRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type AccessRequestItem = {
  id: string;
  patientId: string;
  requesterUserId: string;
  requestedRole: "read_only" | "caregiver";
  requestedCode?: string;
  status: AccessRequestStatus;
  createdAt: string;
  note: string;
};

export type OwnerPendingAccessRequestItem = AccessRequestItem & {
  patientName: string;
};

export type OwnerApprovedAccessItem = {
  requestId: string;
  patientId: string;
  patientName: string;
  memberUserId: string;
  role: "read_only" | "caregiver" | "clinician";
  createdAt: string;
};

function isMissingActivePatientColumnError(error: any) {
  if (!error) return false;
  if (error.code === "PGRST204") return true;
  if (
    typeof error.message === "string" &&
    error.message.includes("active_patient_id")
  ) {
    return true;
  }
  return false;
}

function isPatientMemberInsertPolicyError(error: any) {
  if (!error) return false;
  if (error.code === "42501") return true;
  return (
    typeof error.message === "string" &&
    error.message.includes("row-level security policy") &&
    error.message.includes("patient_members")
  );
}

async function getPatientMembershipCountForUser(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("patient_members")
    .select("patient_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

function randomChunk(length = 4) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function generatePatientCode() {
  return `PT-${randomChunk()}-${randomChunk()}-${randomChunk()}`;
}

export async function getOrCreatePatientAccessCode(
  patientId: string,
  userId: string,
): Promise<string> {
  const { data: existing, error: selectError } = await supabase
    .from("patient_access_codes" as any)
    .select("code")
    .eq("patient_id", patientId)
    .maybeSingle();
  if (selectError) throw selectError;
  const existingCode = (existing as any)?.code as string | undefined;
  if (existingCode) return existingCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generatePatientCode();
    const { error: insertError } = await supabase
      .from("patient_access_codes" as any)
      .insert({
        patient_id: patientId,
        code,
        active: true,
        created_by: userId,
      });
    if (!insertError) return code;
    if (insertError.code !== "23505") throw insertError;
  }

  throw new Error("Could not generate a unique access code. Please retry.");
}

export async function requestAccessByCode(
  userId: string,
  codeRaw: string,
  requestedRole: "read_only" | "caregiver",
  note?: string,
): Promise<void> {
  const code = codeRaw.trim().toUpperCase();
  if (!/^PT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    throw new Error("Invalid patient secret code format.");
  }

  const { data: codeRow, error: codeError } = await supabase
    .from("patient_access_codes" as any)
    .select("patient_id,active")
    .eq("code", code)
    .maybeSingle();
  if (codeError) throw codeError;
  const resolvedPatientId = (codeRow as any)?.patient_id as string | undefined;
  const isActiveCode = (codeRow as any)?.active === true;
  if (!resolvedPatientId || !isActiveCode) {
    throw new Error("Code is invalid or inactive.");
  }

  const patientId = resolvedPatientId;
  const createPendingRequest = async () => {
    const { error } = await supabase
      .from("patient_access_requests" as any)
      .insert({
        patient_id: patientId,
        requester_user_id: userId,
        requested_role: requestedRole,
        status: "pending",
        requested_code: code,
        note: trimmedNote,
      });
    if (error) {
      if (error.code === "23505") {
        throw new Error("You already have a pending request for this patient.");
      }
      throw error;
    }
  };

  const { data: memberRows, error: memberError } = await supabase
    .from("patient_members")
    .select("patient_id,role")
    .eq("patient_id", patientId)
    .eq("user_id", userId)
    .neq("role", "owner");
  if (memberError) throw memberError;

  const { data: ownerMembership, error: ownerMembershipError } = await supabase
    .from("patient_members")
    .select("patient_id")
    .eq("patient_id", patientId)
    .eq("user_id", userId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (ownerMembershipError) throw ownerMembershipError;
  if (ownerMembership) {
    throw new Error("You already have access to this patient.");
  }

  const membershipRows = (memberRows ?? []) as {
    patient_id: string;
    role: "read_only" | "caregiver" | "clinician";
  }[];
  if (membershipRows.length > 0) {
    const { data: approvedMembershipRows, error: approvedMembershipError } =
      await supabase
        .from("patient_access_requests" as any)
        .select("requested_role")
        .eq("patient_id", patientId)
        .eq("requester_user_id", userId)
        .eq("status", "approved");
    if (approvedMembershipError) throw approvedMembershipError;

    const approvedRoles = new Set<string>(
      (approvedMembershipRows ?? []).map((row: any) => row.requested_role as string),
    );
    const hasActiveAccess = membershipRows.some((row) => approvedRoles.has(row.role));

    if (hasActiveAccess) {
      throw new Error("You already have access to this patient.");
    }

    const staleRoles = membershipRows.map((row) => row.role);
    const { data: deletedMembershipRows, error: staleMembershipDeleteError } =
      await supabase
        .from("patient_members")
        .delete()
        .eq("patient_id", patientId)
        .eq("user_id", userId)
        .in("role", staleRoles)
        .select("patient_id,role");
    if (staleMembershipDeleteError) throw staleMembershipDeleteError;

    if ((deletedMembershipRows ?? []).length !== membershipRows.length) {
      throw new Error("Could not refresh your patient access. Please try again.");
    }
  }

  const membershipCount = await getPatientMembershipCountForUser(userId);
  if (membershipCount >= 2) {
    throw new Error("Maximum of 2 patients allowed per user.");
  }

  const nowIso = new Date().toISOString();
  const trimmedNote = note?.trim() || null;
  const { data: existingRequests, error: existingRequestsError } =
    await supabase
      .from("patient_access_requests" as any)
      .select("id,status")
      .eq("patient_id", patientId)
      .eq("requester_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
  if (existingRequestsError) throw existingRequestsError;

  const pendingRequest = (existingRequests ?? []).find(
    (row: any) => row.status === "pending",
  );
  if (pendingRequest) {
    const { data: updatedPendingRow, error: updatePendingError } = await supabase
      .from("patient_access_requests" as any)
      .update({
        requested_role: requestedRole,
        requested_code: code,
        note: trimmedNote,
        updated_at: nowIso,
      })
      .eq("id", pendingRequest.id)
      .select("id")
      .maybeSingle();
    if (updatePendingError) throw updatePendingError;
    if (!updatedPendingRow) {
      throw new Error("Could not refresh your pending access request.");
    }
    return;
  }

  const reusableRequest = (existingRequests ?? []).find((row: any) =>
    ["approved", "rejected", "cancelled"].includes(row.status),
  );
  if (reusableRequest) {
    const { data: reusedRow, error: reuseError } = await supabase
      .from("patient_access_requests" as any)
      .update({
        requested_role: requestedRole,
        status: "pending",
        requested_code: code,
        note: trimmedNote,
        resolved_by: null,
        resolved_at: null,
        updated_at: nowIso,
      })
      .eq("id", reusableRequest.id)
      .select("id")
      .maybeSingle();
    if (reuseError) throw reuseError;
    if (!reusedRow) {
      await createPendingRequest();
    }
    return;
  }

  await createPendingRequest();
}

export async function getMyAccessRequests(
  userId: string,
): Promise<AccessRequestItem[]> {
  const { data, error } = await supabase
    .from("patient_access_requests" as any)
    .select(
      "id,patient_id,requester_user_id,requested_role,requested_code,status,created_at,note",
    )
    .eq("requester_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    patientId: row.patient_id,
    requesterUserId: row.requester_user_id,
    requestedRole: row.requested_role,
    requestedCode: row.requested_code ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    note: row.note ?? "",
  }));
}

export async function getPendingAccessRequestsForPatient(
  patientId: string,
): Promise<AccessRequestItem[]> {
  const { data, error } = await supabase
    .from("patient_access_requests" as any)
    .select(
      "id,patient_id,requester_user_id,requested_role,status,created_at,note",
    )
    .eq("patient_id", patientId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    patientId: row.patient_id,
    requesterUserId: row.requester_user_id,
    requestedRole: row.requested_role,
    status: row.status,
    createdAt: row.created_at,
    note: row.note ?? "",
  }));
}

export async function getOwnerPendingAccessRequests(
  userId: string,
): Promise<OwnerPendingAccessRequestItem[]> {
  const { data: ownedRows, error: ownedError } = await supabase
    .from("patient_members")
    .select("patient_id")
    .eq("user_id", userId)
    .eq("role", "owner");
  if (ownedError) throw ownedError;

  const ownedPatientIds = (ownedRows ?? []).map((row) => row.patient_id);
  if (ownedPatientIds.length === 0) return [];

  const { data, error } = await supabase
    .from("patient_access_requests" as any)
    .select(
      "id,patient_id,requester_user_id,requested_role,status,created_at,note",
    )
    .in("patient_id", ownedPatientIds)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw error;

  const { data: patientRows, error: patientError } = await supabase
    .from("patients")
    .select("id,display_name")
    .in("id", ownedPatientIds);
  if (patientError) throw patientError;

  const patientNameById = new Map<string, string>(
    (patientRows ?? []).map((row) => [row.id, row.display_name]),
  );

  return (data ?? []).map((row: any) => ({
    id: row.id,
    patientId: row.patient_id,
    patientName: patientNameById.get(row.patient_id) ?? "Patient",
    requesterUserId: row.requester_user_id,
    requestedRole: row.requested_role,
    status: row.status,
    createdAt: row.created_at,
    note: row.note ?? "",
  }));
}

export async function getOwnerApprovedAccess(
  userId: string,
): Promise<OwnerApprovedAccessItem[]> {
  const { data: ownedRows, error: ownedError } = await supabase
    .from("patient_members")
    .select("patient_id")
    .eq("user_id", userId)
    .eq("role", "owner");
  if (ownedError) throw ownedError;

  const ownedPatientIds = (ownedRows ?? []).map((row) => row.patient_id);
  if (ownedPatientIds.length === 0) return [];

  const { data: approvedRows, error: approvedError } = await supabase
    .from("patient_access_requests" as any)
    .select("id,patient_id,requester_user_id,requested_role,created_at,status")
    .in("patient_id", ownedPatientIds)
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  if (approvedError) throw approvedError;

  const { data: patientRows, error: patientError } = await supabase
    .from("patients")
    .select("id,display_name")
    .in("id", ownedPatientIds);
  if (patientError) throw patientError;

  const patientNameById = new Map<string, string>(
    (patientRows ?? []).map((row) => [row.id, row.display_name]),
  );

  return (approvedRows ?? []).map((row: any) => ({
    requestId: row.id,
    patientId: row.patient_id,
    patientName: patientNameById.get(row.patient_id) ?? "Patient",
    memberUserId: row.requester_user_id,
    role: row.requested_role,
    createdAt: row.created_at,
  }));
}

export async function resolveAccessRequest(
  request: AccessRequestItem,
  ownerUserId: string,
  approve: boolean,
): Promise<void> {
  const nowIso = new Date().toISOString();
  if (!approve) {
    const { error: updateError } = await supabase
      .from("patient_access_requests" as any)
      .update({
        status: "rejected",
        resolved_by: ownerUserId,
        resolved_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", request.id)
      .eq("status", "pending");
    if (updateError) throw updateError;
    return;
  }

  const requesterMembershipCount = await getPatientMembershipCountForUser(
    request.requesterUserId,
  );
  if (requesterMembershipCount >= 2) {
    throw new Error("This user already has the maximum of 2 patients.");
  }

  const { error: memberError } = await supabase.from("patient_members").insert({
    patient_id: request.patientId,
    user_id: request.requesterUserId,
    role: request.requestedRole,
  });
  // Already a member -> treat as success
  if (memberError && memberError.code !== "23505") {
    if (
      request.requestedRole === "caregiver" &&
      isPatientMemberInsertPolicyError(memberError)
    ) {
      throw new Error(
        "Database policy does not yet allow approving full access. Run the latest patient members schema update and retry.",
      );
    }
    throw memberError;
  }

  const { error: updateError } = await supabase
    .from("patient_access_requests" as any)
    .update({
      status: "approved",
      resolved_by: ownerUserId,
      resolved_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", request.id)
    .eq("status", "pending");
  if (updateError) throw updateError;
}

export async function deleteMyAccessRequest(
  requestId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("patient_access_requests" as any)
    .delete()
    .eq("id", requestId)
    .eq("requester_user_id", userId)
    .in("status", ["pending", "cancelled", "rejected"]);
  if (error) throw error;
}

export async function revokeOwnerApprovedAccess(
  ownerUserId: string,
  requestId: string,
): Promise<void> {
  const { data: requestRow, error: requestRowError } = await supabase
    .from("patient_access_requests" as any)
    .select("id,patient_id,requester_user_id,status")
    .eq("id", requestId)
    .eq("status", "approved")
    .maybeSingle();
  if (requestRowError) throw requestRowError;
  if (!requestRow) {
    throw new Error("This approved access request could not be found.");
  }

  const patientId = requestRow.patient_id as string;
  const memberUserId = requestRow.requester_user_id as string;

  const { data: ownerMembership, error: ownerMembershipError } = await supabase
    .from("patient_members")
    .select("patient_id")
    .eq("patient_id", patientId)
    .eq("user_id", ownerUserId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (ownerMembershipError) throw ownerMembershipError;
  if (!ownerMembership) {
    throw new Error("Only the patient owner can remove this access.");
  }

  const nowIso = new Date().toISOString();
  const { data: existingMembershipRows, error: existingMembershipError } =
    await supabase
      .from("patient_members")
      .select("patient_id,user_id,role")
      .eq("patient_id", patientId)
      .eq("user_id", memberUserId)
      .neq("role", "owner");
  if (existingMembershipError) throw existingMembershipError;

  if ((existingMembershipRows ?? []).length > 0) {
    const removableRoles = (existingMembershipRows ?? []).map((row) => row.role);
    const { data: deletedMembershipRows, error: deleteMembershipError } =
      await supabase
        .from("patient_members")
        .delete()
        .eq("patient_id", patientId)
        .eq("user_id", memberUserId)
        .in("role", removableRoles)
        .select("patient_id,user_id,role");
    if (deleteMembershipError) throw deleteMembershipError;

    if ((deletedMembershipRows ?? []).length !== existingMembershipRows.length) {
      throw new Error("Could not remove this approved member's patient access.");
    }
  }

  const { data: deletedRequestRow, error: deleteRequestError } = await supabase
    .from("patient_access_requests" as any)
    .delete()
    .eq("id", requestId)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();
  if (deleteRequestError) throw deleteRequestError;
  if (!deletedRequestRow) {
    throw new Error("Could not revoke this approved access request.");
  }

  const { error: clearResidualMembershipError } = await supabase
    .from("patient_members")
    .delete()
    .eq("patient_id", patientId)
    .eq("user_id", memberUserId)
    .neq("role", "owner");
  if (
    clearResidualMembershipError &&
    clearResidualMembershipError.code !== "PGRST116"
  ) {
    throw clearResidualMembershipError;
  }

  const { error: clearActivePatientError } = await supabase
    .from("profiles")
    .update({
      active_patient_id: null,
      updated_at: nowIso,
    } as any)
    .eq("id", memberUserId)
    .eq("active_patient_id", patientId);
  if (
    clearActivePatientError &&
    !isMissingActivePatientColumnError(clearActivePatientError)
  ) {
    throw clearActivePatientError;
  }
}

export async function connectReadOnlyAccessByCode(
  userId: string,
  codeRaw: string,
): Promise<void> {
  const code = codeRaw.trim().toUpperCase();
  if (!/^PT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    throw new Error("Invalid patient secret code format.");
  }

  const { data: codeRow, error: codeError } = await supabase
    .from("patient_access_codes" as any)
    .select("patient_id,active")
    .eq("code", code)
    .maybeSingle();
  if (codeError) throw codeError;

  const patientId = (codeRow as any)?.patient_id as string | undefined;
  const isActiveCode = (codeRow as any)?.active === true;
  if (!patientId || !isActiveCode) {
    throw new Error("Code is invalid or inactive.");
  }

  const membershipCount = await getPatientMembershipCountForUser(userId);

  const { data: existingMembership, error: existingError } = await supabase
    .from("patient_members")
    .select("patient_id")
    .eq("user_id", userId)
    .eq("patient_id", patientId)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existingMembership) {
    if (membershipCount >= 2) {
      throw new Error("Maximum of 2 patients allowed per user.");
    }

    const { error: insertError } = await supabase
      .from("patient_members")
      .insert({
        patient_id: patientId,
        user_id: userId,
        role: "read_only",
      });
    if (insertError && insertError.code !== "23505") throw insertError;
  }

  const nowIso = new Date().toISOString();
  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      active_patient_id: patientId,
      updated_at: nowIso,
    } as any)
    .eq("id", userId);

  if (!updateProfileError) return;
  if (isMissingActivePatientColumnError(updateProfileError)) return;

  const { error: upsertProfileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      active_patient_id: patientId,
      updated_at: nowIso,
    } as any,
    { onConflict: "id" },
  );

  if (
    upsertProfileError &&
    !isMissingActivePatientColumnError(upsertProfileError)
  ) {
    throw upsertProfileError;
  }
}
