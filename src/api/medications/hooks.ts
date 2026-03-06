import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMedication,
  CreateMedicationInput,
  deleteMedication,
  getMedications,
  getPrimaryPatient,
  getPrimaryPatientId,
  getUpcomingMedicationDoses,
  searchRxNormDrugs,
  updateMedication,
  UpdateMedicationInput,
} from "./service";

export function usePrimaryPatientId(userId?: string) {
  return useQuery({
    queryKey: ["primary-patient-id", userId],
    queryFn: () => getPrimaryPatientId(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function usePrimaryPatient(userId?: string) {
  return useQuery({
    queryKey: ["primary-patient", userId],
    queryFn: () => getPrimaryPatient(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useUpcomingMedicationDoses(patientId?: string, windowHours = 24) {
  return useQuery({
    queryKey: ["upcoming-med-doses", patientId, windowHours],
    queryFn: () => getUpcomingMedicationDoses(patientId!, windowHours),
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

export function useUpdateMedication(patientId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMedicationInput) => updateMedication(input),
    onSuccess: () => {
      if (!patientId) return;
      qc.invalidateQueries({ queryKey: ["medications", patientId] });
      qc.invalidateQueries({ queryKey: ["upcoming-med-doses", patientId] });
    },
  });
}

export function useDeleteMedication(patientId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (medicationId: string) => deleteMedication(medicationId),
    onSuccess: () => {
      if (!patientId) return;
      qc.invalidateQueries({ queryKey: ["medications", patientId] });
      qc.invalidateQueries({ queryKey: ["upcoming-med-doses", patientId] });
    },
  });
}
