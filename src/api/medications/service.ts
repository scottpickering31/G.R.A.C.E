import { supabase } from "@/services/supabase";
import { QueryData } from "@supabase/supabase-js";
import { UpcomingMedication } from "@/src/components/medications/MedsDueModal";
import { Database } from "@/src/types/database.types";

export type MedicationListItem = {
  id: string;
  name: string;
  dose: string | null;
  route: Database["public"]["Enums"]["medication_route"];
  instructions: string | null;
  active: boolean;
  expires_at: string | null;
  schedule_type: Database["public"]["Enums"]["medication_schedule_type"];
  one_off_due_at: string | null;
  schedule_times: string[];
  stock_quantity: number | null;
  stock_capacity: number | null;
  stock_unit: string | null;
  low_stock_threshold: number | null;
};

export type PrimaryPatient = {
  id: string;
  display_name: string;
  dob: string | null;
};

export type ActivePatientMembership = {
  patientId: string;
  role: Database["public"]["Enums"]["patient_role"];
};

export type AccessiblePatient = {
  id: string;
  display_name: string;
  dob: string | null;
  role: Database["public"]["Enums"]["patient_role"];
  isActive: boolean;
};

export type PatientProfileDetails = {
  id: string;
  display_name: string;
  dob: string | null;
  sex: string | null;
  role: Database["public"]["Enums"]["patient_role"];
  isActive: boolean;
};

export type CreatePatientProfileInput = {
  userId: string;
  displayName: string;
  dob: string;
};

export type CreateMedicationInput = {
  patientId: string;
  userId: string;
  name: string;
  dose?: string;
  route: Database["public"]["Enums"]["medication_route"];
  instructions?: string;
  scheduleType: Database["public"]["Enums"]["medication_schedule_type"];
  dailyTimes?: string[];
  oneOffDueAt?: string;
  expiresAt?: string;
  stockQuantity?: number;
  stockCapacity?: number;
  stockUnit?: string;
  lowStockThreshold?: number;
};

export type UpdateMedicationInput = {
  medicationId: string;
  name: string;
  dose?: string;
  route: Database["public"]["Enums"]["medication_route"];
  instructions?: string;
  scheduleType: Database["public"]["Enums"]["medication_schedule_type"];
  dailyTimes?: string[];
  oneOffDueAt?: string;
  expiresAt?: string;
  stockQuantity?: number;
  stockCapacity?: number;
  stockUnit?: string;
  lowStockThreshold?: number;
};

export type RxNormSuggestion = {
  rxcui: string;
  name: string;
};

export type MedicationHistoryStatus = "taken" | "skipped" | "rejected";

export type MedicationHistoryItem = {
  id: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  dueAt: Date;
  status: MedicationHistoryStatus;
  note?: string;
};

export type LogMedicationHistoryExceptionInput = {
  patientId: string;
  userId: string;
  medicationId: string;
  dueAt: string;
  eventType: "skipped" | "rejected";
  note?: string;
};

export type ClearMedicationHistoryExceptionInput = {
  patientId: string;
  medicationId: string;
  dueAt: string;
};

export type SetActivePatientInput = {
  userId: string;
  patientId: string;
};

export type DeletePatientProfileInput = {
  userId: string;
  patientId: string;
};

function isMissingActivePatientColumnError(error: any) {
  if (!error) return false;
  if (error.code === "PGRST204") return true;
  if (typeof error.message === "string" && error.message.includes("active_patient_id")) {
    return true;
  }
  return false;
}

async function getStoredActivePatientId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("active_patient_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingActivePatientColumnError(error)) return null;
    throw error;
  }

  return data?.active_patient_id ?? null;
}

export async function getPrimaryPatientId(userId: string) {
  const storedActivePatientId = await getStoredActivePatientId(userId);

  if (storedActivePatientId) {
    const { data: membership, error: membershipError } = await supabase
      .from("patient_members")
      .select("patient_id")
      .eq("user_id", userId)
      .eq("patient_id", storedActivePatientId)
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (membership?.patient_id) return membership.patient_id;
  }

  const { data, error } = await supabase
    .from("patient_members")
    .select("patient_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data.patient_id;
}

export async function getPrimaryPatient(userId: string): Promise<PrimaryPatient | null> {
  const activePatientId = await getPrimaryPatientId(userId);
  if (!activePatientId) return null;

  const query = supabase
    .from("patient_members")
    .select("patient:patients(id,display_name,dob),patient_id")
    .eq("user_id", userId)
    .eq("patient_id", activePatientId)
    .limit(1)
    .maybeSingle();

  type PrimaryPatientJoin = QueryData<typeof query>;
  const { data, error } = await query;

  if (error) throw error;
  if (!data) return null;

  const row = data as NonNullable<PrimaryPatientJoin>;
  const patient = Array.isArray(row.patient) ? row.patient[0] : row.patient;
  if (!patient) return null;

  return {
    id: patient.id,
    display_name: patient.display_name,
    dob: patient.dob,
  };
}

export async function getActivePatientMembership(
  userId: string,
): Promise<ActivePatientMembership | null> {
  const activePatientId = await getPrimaryPatientId(userId);
  if (!activePatientId) return null;

  const { data, error } = await supabase
    .from("patient_members")
    .select("patient_id,role")
    .eq("user_id", userId)
    .eq("patient_id", activePatientId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    patientId: data.patient_id,
    role: data.role,
  };
}

export async function getAccessiblePatients(
  userId: string,
): Promise<AccessiblePatient[]> {
  const activePatientId = await getPrimaryPatientId(userId);

  const query = supabase
    .from("patient_members")
    .select("role,patient:patients(id,display_name,dob)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  type PatientMemberWithJoin = QueryData<typeof query>[number];
  const { data, error } = await query;

  if (error) throw error;

  return (data ?? [])
    .map((row: PatientMemberWithJoin) => {
      const patient = Array.isArray(row.patient) ? row.patient[0] : row.patient;
      if (!patient) return null;
      return {
        id: patient.id,
        display_name: patient.display_name,
        dob: patient.dob,
        role: row.role,
        isActive: patient.id === activePatientId,
      };
    })
    .filter((item): item is AccessiblePatient => item != null);
}

export async function getPatientProfileDetails(
  userId: string,
  patientId: string,
): Promise<PatientProfileDetails | null> {
  const activePatientId = await getPrimaryPatientId(userId);

  const query = supabase
    .from("patient_members")
    .select("role,patient:patients(id,display_name,dob,sex)")
    .eq("user_id", userId)
    .eq("patient_id", patientId)
    .limit(1)
    .maybeSingle();

  type PatientDetailsJoin = QueryData<typeof query>;
  const { data, error } = await query;

  if (error) throw error;
  if (!data) return null;

  const row = data as NonNullable<PatientDetailsJoin>;
  const patient = Array.isArray(row.patient) ? row.patient[0] : row.patient;
  if (!patient) return null;

  return {
    id: patient.id,
    display_name: patient.display_name,
    dob: patient.dob,
    sex: patient.sex,
    role: row.role,
    isActive: patient.id === activePatientId,
  };
}

export async function setActivePatient({
  userId,
  patientId,
}: SetActivePatientInput): Promise<void> {
  const { data: membership, error: membershipError } = await supabase
    .from("patient_members")
    .select("patient_id")
    .eq("user_id", userId)
    .eq("patient_id", patientId)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) {
    throw new Error("You do not have access to this patient profile.");
  }

  const nowIso = new Date().toISOString();

  const { data: updatedRow, error: updateError } = await supabase
    .from("profiles")
    .update({
      active_patient_id: patientId,
      updated_at: nowIso,
    } as any)
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (!updateError && updatedRow) return;
  if (isMissingActivePatientColumnError(updateError)) {
    throw new Error(
      "Database is missing profiles.active_patient_id. Run the schema update before setting active patients.",
    );
  }

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        active_patient_id: patientId,
        updated_at: nowIso,
      } as any,
      { onConflict: "id" },
    );
  if (upsertError) {
    if (isMissingActivePatientColumnError(upsertError)) {
      throw new Error(
        "Database is missing profiles.active_patient_id. Run the schema update before setting active patients.",
      );
    }
    throw upsertError;
  }
}

export async function deletePatientProfileForUser({
  userId,
  patientId,
}: DeletePatientProfileInput): Promise<void> {
  const { data: membership, error: membershipError } = await supabase
    .from("patient_members")
    .select("role")
    .eq("user_id", userId)
    .eq("patient_id", patientId)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) {
    throw new Error("You do not have access to this patient profile.");
  }

  if (membership.role === "owner") {
    const { error } = await supabase.from("patients").delete().eq("id", patientId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("patient_members")
      .delete()
      .eq("user_id", userId)
      .eq("patient_id", patientId);
    if (error) throw error;
  }

  const nowIso = new Date().toISOString();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      active_patient_id: null,
      updated_at: nowIso,
    } as any)
    .eq("id", userId)
    .eq("active_patient_id", patientId);

  if (profileError && !isMissingActivePatientColumnError(profileError)) {
    throw profileError;
  }
}

export async function createPatientProfileForUser({
  userId,
  displayName,
  dob,
}: CreatePatientProfileInput): Promise<void> {
  const trimmedName = displayName.trim();
  const trimmedDob = dob.trim();
  if (!trimmedName) {
    throw new Error("Patient name is required.");
  }
  if (!trimmedDob) {
    throw new Error("Date of birth is required.");
  }
  const parsedDob = new Date(trimmedDob);
  if (Number.isNaN(parsedDob.getTime())) {
    throw new Error("Date of birth is invalid.");
  }

  const { count, error: countError } = await supabase
    .from("patient_members")
    .select("patient_id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw countError;
  if ((count ?? 0) >= 2) {
    throw new Error("Maximum of 2 patients allowed per user.");
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      created_by: userId,
      display_name: trimmedName,
      dob: trimmedDob,
    })
    .select("id")
    .single();

  if (patientError) throw patientError;

  const { error: memberError } = await supabase.from("patient_members").insert({
    patient_id: patient.id,
    user_id: userId,
    role: "owner",
  });

  // Membership may already be created by trigger.
  if (memberError && memberError.code !== "23505") throw memberError;
}

export async function getMedications(
  patientId: string,
  limit = 50,
): Promise<MedicationListItem[]> {
  const query = supabase
    .from("medications")
    .select(
      "id,name,dose,route,instructions,active,expires_at,schedule_type,one_off_due_at,stock_quantity,stock_capacity,stock_unit,low_stock_threshold,medication_schedule_times(time_of_day)",
    )
    .eq("patient_id", patientId)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  type MedicationWithTimes = QueryData<typeof query>[number];
  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map((row: MedicationWithTimes) => ({
    ...row,
    schedule_times: (row.medication_schedule_times ?? [])
      .map((t) => t.time_of_day)
      .sort((a, b) => a.localeCompare(b)),
  }));
}

export async function getUpcomingMedicationDoses(
  patientId: string,
  windowHours = 24,
  limit = 500,
): Promise<UpcomingMedication[]> {
  const now = new Date();
  const inWindowDate = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
  const nowIso = now.toISOString();
  const inWindowIso = inWindowDate.toISOString();
  const query = supabase
    .from("medication_doses")
    .select("id,due_at,note,medications(id,name,dose)")
    .eq("patient_id", patientId)
    .eq("status", "pending")
    .gte("due_at", nowIso)
    .lt("due_at", inWindowIso)
    .order("due_at", { ascending: true })
    .limit(limit);

  type MedicationDoseWithMedication = QueryData<typeof query>[number];
  const { data, error } = await query;

  if (error) throw error;

  const fromDoseRows: UpcomingMedication[] = (data ?? []).map(
    (row: MedicationDoseWithMedication) => ({
      id: row.id,
      dueAt: new Date(row.due_at),
      name: row.medications?.name ?? "Medication",
      dose: row.medications?.dose ?? "Dose not set",
      note: row.note ?? undefined,
    }),
  );

  if (fromDoseRows.length >= limit) {
    return fromDoseRows
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .slice(0, limit);
  }

  const medicationQuery = supabase
    .from("medications")
    .select(
      "id,name,dose,one_off_due_at,schedule_type,medication_schedule_times(time_of_day)",
    )
    .eq("patient_id", patientId)
    .eq("active", true)
    .in("schedule_type", ["daily_same_time", "one_off"]);

  type MedicationWithSchedule = QueryData<typeof medicationQuery>[number];
  const { data: medicationRows, error: medicationError } = await medicationQuery;
  if (medicationError) throw medicationError;

  const projected: UpcomingMedication[] = [];
  const existingKeys = new Set(
    ((data ?? []) as MedicationDoseWithMedication[]).map((row) => {
      const medId = row.medications?.id ?? "";
      return `${medId}|${new Date(row.due_at).getTime()}`;
    }),
  );

  const inWindow = (d: Date) => d >= now && d < inWindowDate;

  for (const med of (medicationRows ?? []) as MedicationWithSchedule[]) {
    if (med.schedule_type === "one_off" && med.one_off_due_at) {
      const due = new Date(med.one_off_due_at);
      if (inWindow(due)) {
        const key = `${med.id}|${due.getTime()}`;
        if (!existingKeys.has(key)) {
          projected.push({
            id: `projected-oneoff-${med.id}-${due.toISOString()}`,
            dueAt: due,
            name: med.name,
            dose: med.dose ?? "Dose not set",
            note: "Scheduled one-off dose",
          });
          existingKeys.add(key);
        }
      }
      continue;
    }

    if (med.schedule_type === "daily_same_time") {
      const times = (med.medication_schedule_times ?? []).map((t) => t.time_of_day);
      const daysInWindow = Math.ceil(windowHours / 24);
      for (const time of times) {
        const [hourRaw = "00", minuteRaw = "00"] = time.split(":");
        const hour = Number(hourRaw);
        const minute = Number(minuteRaw);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) continue;

        for (let dayOffset = 0; dayOffset <= daysInWindow; dayOffset += 1) {
          const due = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + dayOffset,
            hour,
            minute,
            0,
            0,
          );
          if (!inWindow(due)) continue;
          const key = `${med.id}|${due.getTime()}`;
          if (existingKeys.has(key)) continue;

          projected.push({
            id: `projected-daily-${med.id}-${time}-${due.toISOString()}`,
            dueAt: due,
            name: med.name,
            dose: med.dose ?? "Dose not set",
            note: "Scheduled daily dose",
          });
          existingKeys.add(key);
        }
      }
    }
  }

  return [...fromDoseRows, ...projected]
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, limit);
}

export async function createMedication({
  patientId,
  userId,
  name,
  dose,
  route,
  instructions,
  scheduleType,
  dailyTimes,
  oneOffDueAt,
  expiresAt,
  stockQuantity,
  stockCapacity,
  stockUnit,
  lowStockThreshold,
}: CreateMedicationInput): Promise<string> {
  const cleanedName = name.trim();
  if (!cleanedName) {
    throw new Error("Medication name is required.");
  }

  const cleanedDose = dose?.trim() || null;
  const cleanedInstructions = instructions?.trim() || null;
  const cleanedOneOffDueAt = oneOffDueAt?.trim() || null;
  const cleanedExpiresAt = expiresAt?.trim() || null;
  const cleanedStockUnit = stockUnit?.trim() || null;
  const cleanedDailyTimes = (dailyTimes ?? [])
    .map((time) => time.trim())
    .filter((time) => time.length > 0);

  if (scheduleType === "daily_same_time" && cleanedDailyTimes.length === 0) {
    throw new Error("Please add at least one daily time.");
  }

  const { data, error } = await supabase
    .from("medications")
    .insert({
      patient_id: patientId,
      created_by: userId,
      name: cleanedName,
      dose: cleanedDose,
      route,
      instructions: cleanedInstructions,
      expires_at: cleanedExpiresAt,
      schedule_type: scheduleType,
      one_off_due_at: cleanedOneOffDueAt,
      stock_quantity: stockQuantity ?? null,
      stock_capacity: stockCapacity ?? stockQuantity ?? null,
      stock_unit: cleanedStockUnit,
      low_stock_threshold: lowStockThreshold ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (scheduleType === "daily_same_time" && cleanedDailyTimes.length > 0) {
    const rows = cleanedDailyTimes.map((time) => ({
      medication_id: data.id,
      time_of_day: time,
    }));

    const { error: timesError } = await supabase
      .from("medication_schedule_times")
      .insert(rows);

    if (timesError) {
      await supabase.from("medications").delete().eq("id", data.id);
      throw timesError;
    }
  }

  return data.id;
}

export async function updateMedication({
  medicationId,
  name,
  dose,
  route,
  instructions,
  scheduleType,
  dailyTimes,
  oneOffDueAt,
  expiresAt,
  stockQuantity,
  stockCapacity,
  stockUnit,
  lowStockThreshold,
}: UpdateMedicationInput): Promise<void> {
  const cleanedName = name.trim();
  if (!cleanedName) throw new Error("Medication name is required.");

  const cleanedDose = dose?.trim() || null;
  const cleanedInstructions = instructions?.trim() || null;
  const cleanedOneOffDueAt = oneOffDueAt?.trim() || null;
  const cleanedExpiresAt = expiresAt?.trim() || null;
  const cleanedStockUnit = stockUnit?.trim() || null;
  const cleanedDailyTimes = (dailyTimes ?? [])
    .map((time) => time.trim())
    .filter((time) => time.length > 0);

  if (scheduleType === "daily_same_time" && cleanedDailyTimes.length === 0) {
    throw new Error("Please add at least one daily time.");
  }

  const { error } = await supabase
    .from("medications")
    .update({
      name: cleanedName,
      dose: cleanedDose,
      route,
      instructions: cleanedInstructions,
      expires_at: cleanedExpiresAt,
      schedule_type: scheduleType,
      one_off_due_at: cleanedOneOffDueAt,
      stock_quantity: stockQuantity ?? null,
      stock_capacity: stockCapacity ?? null,
      stock_unit: cleanedStockUnit,
      low_stock_threshold: lowStockThreshold ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", medicationId);

  if (error) throw error;

  const { error: deleteTimesError } = await supabase
    .from("medication_schedule_times")
    .delete()
    .eq("medication_id", medicationId);
  if (deleteTimesError) throw deleteTimesError;

  if (scheduleType === "daily_same_time" && cleanedDailyTimes.length > 0) {
    const { error: insertTimesError } = await supabase
      .from("medication_schedule_times")
      .insert(
        cleanedDailyTimes.map((time) => ({
          medication_id: medicationId,
          time_of_day: time,
        })),
      );
    if (insertTimesError) throw insertTimesError;
  }
}

export async function deleteMedication(medicationId: string): Promise<void> {
  const { error } = await supabase
    .from("medications")
    .delete()
    .eq("id", medicationId);
  if (error) throw error;
}

type RxNormSpellingPayload = {
  suggestionGroup?: {
    suggestionList?: {
      suggestion?: string[];
    };
  };
};

function mapRxNormSuggestions(payload: RxNormSpellingPayload): RxNormSuggestion[] {
  const values = payload.suggestionGroup?.suggestionList?.suggestion;
  if (!Array.isArray(values)) return [];

  return values
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .map((name) => ({
      rxcui: name.toLowerCase(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }));
}

export async function searchRxNormDrugs(
  query: string,
  limit = 12,
): Promise<RxNormSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const endpoint = `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(trimmed)}`;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Could not load medication suggestions.");
  }

  const payload = (await response.json()) as RxNormSpellingPayload;
  return mapRxNormSuggestions(payload).slice(0, limit);
}

type MedicationHistoryEventRow = {
  medication_id: string;
  occurred_at: string;
  event_type: "skipped" | "rejected";
  note: string | null;
};

function parseDoseForStockDecrease(dose: string | null, stockUnit: string | null) {
  if (!dose) return 1;
  const match = dose.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return 1;

  const qty = Number(match[1]);
  if (!Number.isFinite(qty) || qty <= 0) return 1;

  const doseUnit = (match[2] || "").trim().toLowerCase();
  const normalizedStockUnit = (stockUnit || "").trim().toLowerCase();
  if (doseUnit && normalizedStockUnit && doseUnit !== normalizedStockUnit) {
    return 1;
  }

  return qty;
}

export async function getMedicationHistory(
  patientId: string,
  lookbackDays = 7,
  limit = 50,
): Promise<MedicationHistoryItem[]> {
  const now = new Date();
  const fromDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const nowIso = now.toISOString();
  const fromIso = fromDate.toISOString();

  const medicationQuery = supabase
    .from("medications")
    .select(
      "id,name,dose,stock_unit,one_off_due_at,schedule_type,medication_schedule_times(time_of_day)",
    )
    .eq("patient_id", patientId)
    .eq("active", true)
    .in("schedule_type", ["daily_same_time", "one_off"]);

  type MedicationWithSchedule = QueryData<typeof medicationQuery>[number];
  const { data: medicationRows, error: medicationError } = await medicationQuery;
  if (medicationError) throw medicationError;

  const adherenceQuery = supabase
    .from("medication_adherence_events" as any)
    .select("medication_id,occurred_at,event_type,note")
    .eq("patient_id", patientId)
    .gte("occurred_at", fromIso)
    .lte("occurred_at", nowIso)
    .order("occurred_at", { ascending: false })
    .limit(1000);

  const { data: eventRows, error: eventError } = await adherenceQuery;
  if (eventError) throw eventError;

  const eventByKey = new Map<string, MedicationHistoryEventRow>();
  for (const row of ((eventRows ?? []) as unknown as MedicationHistoryEventRow[])) {
    const key = `${row.medication_id}|${new Date(row.occurred_at).getTime()}`;
    eventByKey.set(key, {
      medication_id: row.medication_id,
      occurred_at: row.occurred_at,
      event_type: row.event_type,
      note: row.note ?? null,
    });
  }

  const history: MedicationHistoryItem[] = [];

  for (const med of (medicationRows ?? []) as MedicationWithSchedule[]) {
    if (med.schedule_type === "one_off" && med.one_off_due_at) {
      const due = new Date(med.one_off_due_at);
      if (due >= fromDate && due <= now) {
        const key = `${med.id}|${due.getTime()}`;
        const event = eventByKey.get(key);
        history.push({
          id: `history-oneoff-${med.id}-${due.toISOString()}`,
          medicationId: med.id,
          medicationName: med.name,
          dose: med.dose ?? "Dose not set",
          dueAt: due,
          status: event?.event_type ?? "taken",
          note: event?.note ?? undefined,
        });
      }
      continue;
    }

    if (med.schedule_type === "daily_same_time") {
      const times = (med.medication_schedule_times ?? []).map((t) => t.time_of_day);
      for (const time of times) {
        const [hourRaw = "00", minuteRaw = "00"] = time.split(":");
        const hour = Number(hourRaw);
        const minute = Number(minuteRaw);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) continue;

        for (let dayOffset = 0; dayOffset <= lookbackDays; dayOffset += 1) {
          const due = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - dayOffset,
            hour,
            minute,
            0,
            0,
          );
          if (due < fromDate || due > now) continue;

          const key = `${med.id}|${due.getTime()}`;
          const event = eventByKey.get(key);
          history.push({
            id: `history-daily-${med.id}-${time}-${due.toISOString()}`,
            medicationId: med.id,
            medicationName: med.name,
            dose: med.dose ?? "Dose not set",
            dueAt: due,
            status: event?.event_type ?? "taken",
            note: event?.note ?? undefined,
          });
        }
      }
    }
  }

  return history
    .sort((a, b) => b.dueAt.getTime() - a.dueAt.getTime())
    .slice(0, limit);
}

export async function logMedicationHistoryException({
  patientId,
  userId,
  medicationId,
  dueAt,
  eventType,
  note,
}: LogMedicationHistoryExceptionInput): Promise<void> {
  const dueDate = new Date(dueAt);
  if (Number.isNaN(dueDate.getTime())) {
    throw new Error("Invalid due date.");
  }

  const { error: eventError } = await supabase
    .from("medication_adherence_events" as any)
    .upsert(
      {
        patient_id: patientId,
        medication_id: medicationId,
        occurred_at: dueDate.toISOString(),
        event_type: eventType,
        note: note?.trim() || null,
        created_by: userId,
      },
      {
        onConflict: "medication_id,occurred_at",
      },
    );
  if (eventError) throw eventError;

  if (eventType !== "rejected") return;

  const { data: medication, error: medicationError } = await supabase
    .from("medications")
    .select("id,stock_quantity,stock_unit,dose")
    .eq("id", medicationId)
    .maybeSingle();
  if (medicationError) throw medicationError;
  if (!medication || medication.stock_quantity == null) return;

  const decrement = parseDoseForStockDecrease(
    medication.dose ?? null,
    medication.stock_unit ?? null,
  );
  const nextStock = Math.max(0, medication.stock_quantity - decrement);

  const { error: updateError } = await supabase
    .from("medications")
    .update({
      stock_quantity: nextStock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", medicationId);
  if (updateError) throw updateError;
}

export async function clearMedicationHistoryException({
  patientId,
  medicationId,
  dueAt,
}: ClearMedicationHistoryExceptionInput): Promise<void> {
  const dueDate = new Date(dueAt);
  if (Number.isNaN(dueDate.getTime())) {
    throw new Error("Invalid due date.");
  }

  const { error } = await supabase
    .from("medication_adherence_events" as any)
    .delete()
    .eq("patient_id", patientId)
    .eq("medication_id", medicationId)
    .eq("occurred_at", dueDate.toISOString());
  if (error) throw error;
}
