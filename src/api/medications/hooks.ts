import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMedication,
  CreateMedicationInput,
  getMedications,
  getPrimaryPatientId,
  getUpcomingMedicationDoses,
  searchRxNormDrugs,
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

export function useMedications(patientId?: string) {
  return useQuery({
    queryKey: ["medications", patientId],
    queryFn: () => getMedications(patientId!),
    enabled: !!patientId,
    staleTime: 20_000,
  });
}

export function useRxNormSearch(query?: string) {
  const normalized = query?.trim() ?? "";
  return useQuery({
    queryKey: ["rxnorm-search", normalized],
    queryFn: () => searchRxNormDrugs(normalized),
    enabled: normalized.length >= 2,
    staleTime: 60_000,
  });
}

export function useCreateMedication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMedicationInput) => createMedication(input),
    onSuccess: (_id, input) => {
      qc.invalidateQueries({ queryKey: ["medications", input.patientId] });
      qc.invalidateQueries({ queryKey: ["upcoming-med-doses", input.patientId] });
    },
  });
}
