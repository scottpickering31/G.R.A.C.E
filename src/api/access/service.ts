import { supabase } from "@/services/supabase";

export type AccessRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type AccessRequestItem = {
  id: string;
  patientId: string;
  requesterUserId: string;
  requestedRole: "read_only" | "caregiver";
  status: AccessRequestStatus;
  createdAt: string;
  note: string;
};

export type OwnerPendingAccessRequestItem = AccessRequestItem & {
  patientName: string;
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

  const { data: memberRow, error: memberError } = await supabase
    .from("patient_members")
    .select("patient_id")
    .eq("patient_id", patientId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (memberError) throw memberError;
  if (memberRow) {
    throw new Error("You already have access to this patient.");
  }

  const { error } = await supabase
    .from("patient_access_requests" as any)
    .insert({
      patient_id: patientId,
      requester_user_id: userId,
      requested_role: requestedRole,
      status: "pending",
      requested_code: code,
      note: note?.trim() || null,
    });
  if (error) {
    if (error.code === "23505") {
      throw new Error("You already have a pending request for this patient.");
    }
    throw error;
  }
}

export async function getMyAccessRequests(userId: string): Promise<AccessRequestItem[]> {
  const { data, error } = await supabase
    .from("patient_access_requests" as any)
    .select("id,patient_id,requester_user_id,requested_role,status,created_at,note")
    .eq("requester_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(25);
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

export async function getPendingAccessRequestsForPatient(
  patientId: string,
): Promise<AccessRequestItem[]> {
  const { data, error } = await supabase
    .from("patient_access_requests" as any)
    .select("id,patient_id,requester_user_id,requested_role,status,created_at,note")
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
    .select("id,patient_id,requester_user_id,requested_role,status,created_at,note")
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

export async function resolveAccessRequest(
  request: AccessRequestItem,
  ownerUserId: string,
  approve: boolean,
): Promise<void> {
  const status: AccessRequestStatus = approve ? "approved" : "rejected";
  const nowIso = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("patient_access_requests" as any)
    .update({
      status,
      resolved_by: ownerUserId,
      resolved_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", request.id)
    .eq("status", "pending");
  if (updateError) throw updateError;

  if (!approve) return;

  const { error: memberError } = await supabase.from("patient_members").insert({
    patient_id: request.patientId,
    user_id: request.requesterUserId,
    role: request.requestedRole,
  });
  // Already a member -> treat as success
  if (memberError && memberError.code !== "23505") throw memberError;
}

export async function cancelMyAccessRequest(
  requestId: string,
  userId: string,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("patient_access_requests" as any)
    .update({
      status: "cancelled",
      updated_at: nowIso,
      resolved_at: nowIso,
    })
    .eq("id", requestId)
    .eq("requester_user_id", userId)
    .eq("status", "pending");
  if (error) throw error;
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

  const { data: existingMembership, error: existingError } = await supabase
    .from("patient_members")
    .select("patient_id")
    .eq("user_id", userId)
    .eq("patient_id", patientId)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existingMembership) {
    const { error: insertError } = await supabase.from("patient_members").insert({
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

  const { error: upsertProfileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        active_patient_id: patientId,
        updated_at: nowIso,
      } as any,
      { onConflict: "id" },
    );

  if (upsertProfileError && !isMissingActivePatientColumnError(upsertProfileError)) {
    throw upsertProfileError;
  }
}
