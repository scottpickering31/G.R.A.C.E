import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivePatientMembership,
  AccessiblePatient,
  clearMedicationHistoryException,
  ClearMedicationHistoryExceptionInput,
  createPatientProfileForUser,
  CreatePatientProfileInput,
  createMedication,
  CreateMedicationInput,
  deletePatientProfileForUser,
  DeletePatientProfileInput,
  deleteMedication,
  getMedicationHistory,
  getMedications,
  getActivePatientMembership,
  getAccessiblePatients,
  getPatientProfileDetails,
  PrimaryPatient,
  getPrimaryPatient,
  getPrimaryPatientId,
  setActivePatient,
  getUpcomingMedicationDoses,
  logMedicationHistoryException,
  LogMedicationHistoryExceptionInput,
  PatientProfileDetails,
  searchRxNormDrugs,
  SetActivePatientInput,
  updateMedication,
  UpdateMedicationInput,
} from "./service";

export function usePrimaryPatientId(userId?: string) {
  return useQuery({
    queryKey: ["primary-patient-id", userId],
    queryFn: () => getPrimaryPatientId(userId!),
    enabled: !!userId,
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}

export function usePrimaryPatient(userId?: string) {
  return useQuery({
    queryKey: ["primary-patient", userId],
    queryFn: () => getPrimaryPatient(userId!),
    enabled: !!userId,
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}

export function useActivePatientMembership(userId?: string) {
  return useQuery<ActivePatientMembership | null>({
    queryKey: ["active-patient-membership", userId],
    queryFn: () => getActivePatientMembership(userId!),
    enabled: !!userId,
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}

export function useAccessiblePatients(userId?: string) {
  return useQuery<AccessiblePatient[]>({
    queryKey: ["accessible-patients", userId],
    queryFn: () => getAccessiblePatients(userId!),
    enabled: !!userId,
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}

export function usePatientProfileDetails(userId?: string, patientId?: string) {
  return useQuery<PatientProfileDetails | null>({
    queryKey: ["patient-profile-details", userId, patientId],
    queryFn: () => getPatientProfileDetails(userId!, patientId!),
    enabled: !!userId && !!patientId,
    staleTime: 30_000,
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

export function useMedicationHistory(patientId?: string, lookbackDays = 7) {
  return useQuery({
    queryKey: ["medication-history", patientId, lookbackDays],
    queryFn: () => getMedicationHistory(patientId!, lookbackDays),
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

export function useLogMedicationHistoryException(patientId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: LogMedicationHistoryExceptionInput) =>
      logMedicationHistoryException(input),
    onSuccess: () => {
      if (!patientId) return;
      qc.invalidateQueries({ queryKey: ["medication-history", patientId] });
      qc.invalidateQueries({ queryKey: ["medications", patientId] });
      qc.invalidateQueries({ queryKey: ["upcoming-med-doses", patientId] });
    },
  });
}

export function useClearMedicationHistoryException(patientId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: ClearMedicationHistoryExceptionInput) =>
      clearMedicationHistoryException(input),
    onSuccess: () => {
      if (!patientId) return;
      qc.invalidateQueries({ queryKey: ["medication-history", patientId] });
      qc.invalidateQueries({ queryKey: ["medications", patientId] });
      qc.invalidateQueries({ queryKey: ["upcoming-med-doses", patientId] });
    },
  });
}

export function useSetActivePatient(userId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: SetActivePatientInput) => setActivePatient(input),
    onMutate: async (input) => {
      if (!userId) return undefined;

      await Promise.all([
        qc.cancelQueries({ queryKey: ["accessible-patients", userId] }),
        qc.cancelQueries({ queryKey: ["primary-patient-id", userId] }),
        qc.cancelQueries({ queryKey: ["primary-patient", userId] }),
        qc.cancelQueries({ queryKey: ["active-patient-membership", userId] }),
      ]);

      const previousAccessiblePatients = qc.getQueryData<AccessiblePatient[]>([
        "accessible-patients",
        userId,
      ]);
      const previousPrimaryPatientId = qc.getQueryData<string | null>([
        "primary-patient-id",
        userId,
      ]);
      const previousPrimaryPatient = qc.getQueryData<PrimaryPatient | null>([
        "primary-patient",
        userId,
      ]);
      const previousActivePatientMembership =
        qc.getQueryData<ActivePatientMembership | null>([
          "active-patient-membership",
          userId,
        ]);

      const nextActivePatient =
        previousAccessiblePatients?.find((patient) => patient.id === input.patientId) ??
        null;

      qc.setQueryData(["primary-patient-id", userId], input.patientId);
      qc.setQueryData<AccessiblePatient[] | undefined>(
        ["accessible-patients", userId],
        (current) =>
          current?.map((patient) => ({
            ...patient,
            isActive: patient.id === input.patientId,
          })),
      );

      if (nextActivePatient) {
        qc.setQueryData<PrimaryPatient | null>(["primary-patient", userId], {
          id: nextActivePatient.id,
          display_name: nextActivePatient.display_name,
          dob: nextActivePatient.dob,
        });
        qc.setQueryData<ActivePatientMembership | null>(
          ["active-patient-membership", userId],
          {
            patientId: nextActivePatient.id,
            role: nextActivePatient.role,
          },
        );
      }

      return {
        previousAccessiblePatients,
        previousPrimaryPatientId,
        previousPrimaryPatient,
        previousActivePatientMembership,
      };
    },
    onError: (_error, _input, context) => {
      if (!userId || !context) return;

      qc.setQueryData(
        ["accessible-patients", userId],
        context.previousAccessiblePatients,
      );
      qc.setQueryData(
        ["primary-patient-id", userId],
        context.previousPrimaryPatientId,
      );
      qc.setQueryData(["primary-patient", userId], context.previousPrimaryPatient);
      qc.setQueryData(
        ["active-patient-membership", userId],
        context.previousActivePatientMembership,
      );
    },
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["accessible-patients", userId] });
      qc.invalidateQueries({ queryKey: ["primary-patient-id", userId] });
      qc.invalidateQueries({ queryKey: ["primary-patient", userId] });
      qc.invalidateQueries({ queryKey: ["active-patient-membership", userId] });
      qc.invalidateQueries({ queryKey: ["my-access-requests", userId] });
      qc.invalidateQueries({ queryKey: ["patient-profile-details", userId] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["upcoming-med-doses"] });
      qc.invalidateQueries({ queryKey: ["medication-history"] });
    },
  });
}

export function useCreatePatientProfile(userId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePatientProfileInput) => createPatientProfileForUser(input),
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["accessible-patients", userId] });
      qc.invalidateQueries({ queryKey: ["primary-patient-id", userId] });
      qc.invalidateQueries({ queryKey: ["primary-patient", userId] });
      qc.invalidateQueries({ queryKey: ["active-patient-membership", userId] });
    },
  });
}

export function useDeletePatientProfile(userId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: DeletePatientProfileInput) => deletePatientProfileForUser(input),
    onSuccess: (remainingPatientCount) => {
      if (!userId) return;
      qc.setQueryData(["has-patient-access", userId], remainingPatientCount > 0);
      if (remainingPatientCount === 0) {
        qc.setQueryData<AccessiblePatient[]>(["accessible-patients", userId], []);
        qc.setQueryData(["primary-patient-id", userId], null);
        qc.setQueryData<PrimaryPatient | null>(["primary-patient", userId], null);
        qc.setQueryData<ActivePatientMembership | null>(
          ["active-patient-membership", userId],
          null,
        );
      }

      qc.invalidateQueries({ queryKey: ["has-patient-access", userId] });
      qc.invalidateQueries({ queryKey: ["my-access-requests", userId] });
      qc.invalidateQueries({ queryKey: ["accessible-patients", userId] });
      qc.invalidateQueries({ queryKey: ["primary-patient-id", userId] });
      qc.invalidateQueries({ queryKey: ["primary-patient", userId] });
      qc.invalidateQueries({ queryKey: ["active-patient-membership", userId] });
      qc.invalidateQueries({ queryKey: ["patient-profile-details", userId] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["medications"] });
      qc.invalidateQueries({ queryKey: ["upcoming-med-doses"] });
      qc.invalidateQueries({ queryKey: ["medication-history"] });
    },
  });
}
