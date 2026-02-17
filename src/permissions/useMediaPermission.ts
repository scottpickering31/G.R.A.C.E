// src/permissions/useMediaPermission.ts
import { PermissionState } from "@/types/notifications";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";

function mapStatus(status: ImagePicker.PermissionStatus): PermissionState {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export function useMediaPermission() {
  const [status, setStatus] = useState<PermissionState>("undetermined");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await ImagePicker.getMediaLibraryPermissionsAsync();
    setStatus(mapStatus(res.status));
    setLoading(false);
  }, []);

  const request = useCallback(async () => {
    setLoading(true);
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setStatus(mapStatus(res.status));
    setLoading(false);
    return mapStatus(res.status);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh, request };
}
