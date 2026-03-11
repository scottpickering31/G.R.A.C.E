import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  connectReadOnlyAccessByCode,
  AccessRequestItem,
  deleteMyAccessRequest,
  getOwnerApprovedAccess,
  OwnerPendingAccessRequestItem,
  OwnerApprovedAccessItem,
  getMyAccessRequests,
  getOwnerPendingAccessRequests,
  getOrCreatePatientAccessCode,
  getPendingAccessRequestsForPatient,
  revokeOwnerApprovedAccess,
  requestAccessByCode,
  resolveAccessRequest,
} from "./service";

export function usePatientAccessCode(patientId?: string, userId?: string, enabled = false) {
  return useQuery({
    queryKey: ["patient-access-code", patientId, userId],
    queryFn: () => getOrCreatePatientAccessCode(patientId!, userId!),
    enabled: !!patientId && !!userId && enabled,
    staleTime: 60_000,
  });
}

export function useRequestReadOnlyAccess(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      code,
      requestedRole,
      note,
    }: {
      code: string;
      requestedRole: "read_only" | "caregiver";
      note?: string;
    }) => requestAccessByCode(userId!, code, requestedRole, note),
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["my-access-requests", userId] });
      qc.invalidateQueries({ queryKey: ["owner-pending-access-requests"] });
    },
  });
}

export function useMyAccessRequests(userId?: string) {
  return useQuery<AccessRequestItem[]>({
    queryKey: ["my-access-requests", userId],
    queryFn: () => getMyAccessRequests(userId!),
    enabled: !!userId,
    staleTime: 20_000,
    refetchInterval: 10_000,
  });
}

export function usePendingAccessRequestsForPatient(patientId?: string) {
  return useQuery<AccessRequestItem[]>({
    queryKey: ["pending-access-requests", patientId],
    queryFn: () => getPendingAccessRequestsForPatient(patientId!),
    enabled: !!patientId,
    staleTime: 20_000,
  });
}

export function useResolveAccessRequest(patientId?: string, userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      approve,
    }: {
      request: AccessRequestItem;
      approve: boolean;
    }) => resolveAccessRequest(request, userId!, approve),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-access-requests"] });
      if (userId) {
        qc.invalidateQueries({ queryKey: ["accessible-patients", userId] });
        qc.invalidateQueries({ queryKey: ["owner-pending-access-requests", userId] });
        qc.invalidateQueries({ queryKey: ["owner-approved-access", userId] });
        qc.invalidateQueries({ queryKey: ["patient-profile-details", userId] });
      }
    },
  });
}

export function useConnectReadOnlyAccessByCode(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => connectReadOnlyAccessByCode(userId!, code),
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["accessible-patients", userId] });
      qc.invalidateQueries({ queryKey: ["primary-patient-id", userId] });
      qc.invalidateQueries({ queryKey: ["primary-patient", userId] });
    },
  });
}

export function useOwnerPendingAccessRequests(userId?: string) {
  return useQuery<OwnerPendingAccessRequestItem[]>({
    queryKey: ["owner-pending-access-requests", userId],
    queryFn: () => getOwnerPendingAccessRequests(userId!),
    enabled: !!userId,
    staleTime: 20_000,
    refetchInterval: 5_000,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}

export function useOwnerApprovedAccess(userId?: string) {
  return useQuery<OwnerApprovedAccessItem[]>({
    queryKey: ["owner-approved-access", userId],
    queryFn: () => getOwnerApprovedAccess(userId!),
    enabled: !!userId,
    staleTime: 20_000,
    refetchInterval: 5_000,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}

export function useDeleteMyAccessRequest(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => deleteMyAccessRequest(requestId, userId!),
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["my-access-requests", userId] });
      qc.invalidateQueries({ queryKey: ["owner-pending-access-requests"] });
    },
  });
}

export function useRevokeOwnerApprovedAccess(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
    }: {
      requestId: string;
    }) => revokeOwnerApprovedAccess(userId!, requestId),
    onSuccess: () => {
      if (!userId) return;
      qc.invalidateQueries({ queryKey: ["owner-approved-access", userId] });
      qc.invalidateQueries({ queryKey: ["accessible-patients"] });
      qc.invalidateQueries({ queryKey: ["primary-patient-id"] });
      qc.invalidateQueries({ queryKey: ["primary-patient"] });
      qc.invalidateQueries({ queryKey: ["active-patient-membership"] });
    },
  });
}
