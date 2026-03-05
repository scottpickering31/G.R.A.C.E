import { supabase } from "@/services/supabase";
import { UpcomingMedication } from "@/src/components/medications/MedsDueModal";

type MembershipRow = {
  patient_id: string;
};

type MedicationDoseRow = {
  id: string;
  due_at: string;
  note: string | null;
  medications: { name: string; dose: string | null } | null;
};

export async function getPrimaryPatientId(userId: string) {
  const { data, error } = await (supabase as any)
    .from("patient_members")
    .select("patient_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return (data as MembershipRow).patient_id;
}

export async function getUpcomingMedicationDoses(
  patientId: string,
  limit = 20,
): Promise<UpcomingMedication[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await (supabase as any)
    .from("medication_doses")
    .select("id,due_at,note,medications(name,dose)")
    .eq("patient_id", patientId)
    .eq("status", "pending")
    .gte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return ((data ?? []) as MedicationDoseRow[]).map((row) => ({
    id: row.id,
    dueAt: new Date(row.due_at),
    name: row.medications?.name ?? "Medication",
    dose: row.medications?.dose ?? "Dose not set",
    note: row.note ?? undefined,
  }));
}
