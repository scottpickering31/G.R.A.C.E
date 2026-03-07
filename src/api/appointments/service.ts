import { supabase } from "@/services/supabase";

export type AppointmentItem = {
  id: string;
  title: string;
  startsAt: string;
  type: string;
  location: string;
  clinician: string;
  notes: string;
  completed: boolean;
};

export type UpsertAppointmentInput = {
  id?: string;
  patientId: string;
  userId: string;
  title: string;
  startsAt: string;
  type?: string;
  location?: string;
  clinician?: string;
  notes?: string;
};

export type SetAppointmentCompletedInput = {
  appointmentId: string;
  completed: boolean;
};

function toItem(row: {
  id: string;
  title: string;
  starts_at: string;
  appointment_type: string;
  location: string | null;
  clinician: string | null;
  notes: string | null;
  completed: boolean;
}): AppointmentItem {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    type: row.appointment_type,
    location: row.location ?? "Not set",
    clinician: row.clinician ?? "Not set",
    notes: row.notes ?? "",
    completed: row.completed,
  };
}

export async function getAppointments(
  patientId: string,
  limit = 500,
): Promise<AppointmentItem[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id,title,starts_at,appointment_type,location,clinician,notes,completed",
    )
    .eq("patient_id", patientId)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toItem);
}

export async function upsertAppointment(input: UpsertAppointmentInput): Promise<void> {
  const startsDate = new Date(input.startsAt);
  if (Number.isNaN(startsDate.getTime())) {
    throw new Error("Invalid appointment time.");
  }
  const appointmentDate = startsDate.toISOString().slice(0, 10);

  const payload = {
    id: input.id,
    patient_id: input.patientId,
    created_by: input.userId,
    title: input.title.trim(),
    starts_at: startsDate.toISOString(),
    appointment_date: appointmentDate,
    appointment_type: input.type?.trim() || "General",
    location: input.location?.trim() || "Not set",
    clinician: input.clinician?.trim() || "Not set",
    notes: input.notes?.trim() || "",
    source: "manual",
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase
      .from("appointments")
      .update({
        title: payload.title,
        starts_at: payload.starts_at,
        appointment_date: payload.appointment_date,
        appointment_type: payload.appointment_type,
        location: payload.location,
        clinician: payload.clinician,
        notes: payload.notes,
        updated_at: payload.updated_at,
      })
      .eq("id", input.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("appointments").insert(payload);
  if (error) throw error;
}

export async function setAppointmentCompleted({
  appointmentId,
  completed,
}: SetAppointmentCompletedInput): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);
  if (error) throw error;
}
