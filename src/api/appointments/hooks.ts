import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AppointmentItem,
  getAppointments,
  setAppointmentCompleted,
  SetAppointmentCompletedInput,
  upsertAppointment,
  UpsertAppointmentInput,
} from "./service";

export function useAppointments(patientId?: string) {
  return useQuery<AppointmentItem[]>({
    queryKey: ["appointments", patientId],
    queryFn: () => getAppointments(patientId!),
    enabled: !!patientId,
    staleTime: 20_000,
  });
}

export function useUpsertAppointment(patientId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertAppointmentInput) => upsertAppointment(input),
    onSuccess: () => {
      if (!patientId) return;
      qc.invalidateQueries({ queryKey: ["appointments", patientId] });
    },
  });
}

export function useSetAppointmentCompleted(patientId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: SetAppointmentCompletedInput) =>
      setAppointmentCompleted(input),
    onSuccess: () => {
      if (!patientId) return;
      qc.invalidateQueries({ queryKey: ["appointments", patientId] });
    },
  });
}
