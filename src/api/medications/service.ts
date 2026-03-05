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
  schedule_type: Database["public"]["Enums"]["medication_schedule_type"];
  one_off_due_at: string | null;
  schedule_times: string[];
  stock_quantity: number | null;
  stock_unit: string | null;
  low_stock_threshold: number | null;
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
  stockQuantity?: number;
  stockUnit?: string;
  lowStockThreshold?: number;
};

export type RxNormSuggestion = {
  rxcui: string;
  name: string;
};

export async function getPrimaryPatientId(userId: string) {
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

export async function getMedications(
  patientId: string,
  limit = 50,
): Promise<MedicationListItem[]> {
  const query = supabase
    .from("medications")
    .select(
      "id,name,dose,route,instructions,active,schedule_type,one_off_due_at,stock_quantity,stock_unit,low_stock_threshold,medication_schedule_times(time_of_day)",
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
  limit = 20,
): Promise<UpcomingMedication[]> {
  const nowIso = new Date().toISOString();
  const query = supabase
    .from("medication_doses")
    .select("id,due_at,note,medications(name,dose)")
    .eq("patient_id", patientId)
    .eq("status", "pending")
    .gte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(limit);

  type MedicationDoseWithMedication = QueryData<typeof query>[number];
  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map((row: MedicationDoseWithMedication) => ({
    id: row.id,
    dueAt: new Date(row.due_at),
    name: row.medications?.name ?? "Medication",
    dose: row.medications?.dose ?? "Dose not set",
    note: row.note ?? undefined,
  }));
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
  stockQuantity,
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
      schedule_type: scheduleType,
      one_off_due_at: cleanedOneOffDueAt,
      stock_quantity: stockQuantity ?? null,
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
