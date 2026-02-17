// src/permissions/useNotificationsPermission.ts
import { PermissionState } from "@/types/notifications";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";

function mapStatus(status: Notifications.PermissionStatus): PermissionState {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export function useNotificationsPermission() {
  const [status, setStatus] = useState<PermissionState>("undetermined");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const settings = await Notifications.getPermissionsAsync();
    setStatus(mapStatus(settings.status));
    setLoading(false);
  }, []);

  const request = useCallback(async () => {
    setLoading(true);

    // Android 13+ requires runtime permission for notifications
    const res = await Notifications.requestPermissionsAsync();
    setStatus(mapStatus(res.status));

    setLoading(false);
    return mapStatus(res.status);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh, request };
}
