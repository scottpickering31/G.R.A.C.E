import { useQuery } from "@tanstack/react-query";
import {
  getPrimaryPatientId,
  getUpcomingMedicationDoses,
} from "./service";

export function usePrimaryPatientId(userId?: string) {
  return useQuery({
    queryKey: ["primary-patient-id", userId],
    queryFn: () => getPrimaryPatientId(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useUpcomingMedicationDoses(patientId?: string) {
  return useQuery({
    queryKey: ["upcoming-med-doses", patientId],
    queryFn: () => getUpcomingMedicationDoses(patientId!),
    enabled: !!patientId,
    staleTime: 30_000,
  });
}
