// app/(onboarding)/permissions.tsx
import { useSetOnboardingCompleted } from "@/src/api/onboarding/hooks";
import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import { useMediaPermission } from "@/src/permissions/useMediaPermission";
import { useNotificationsPermission } from "@/src/permissions/useNotificationsPermission";
import { useAuthStore } from "@/src/state/auth.store";
import { PermissionState } from "@/src/types/notifications";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

function StatusPill({ status }: { status: PermissionState }) {
  const label =
    status === "granted"
      ? "Enabled"
      : status === "denied"
        ? "Disabled"
        : "Not set";

  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.7)",
      }}
    >
      <AppText style={{ fontSize: 12, fontWeight: "700" }}>{label}</AppText>
    </View>
  );
}

export default function Permissions() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);

  const notif = useNotificationsPermission();
  const media = useMediaPermission();

  const { mutate, isPending } = useSetOnboardingCompleted();

  const requestOrSettings = async (
    requestFn: () => Promise<any>,
    status: string,
  ) => {
    if (status === "denied") {
      Linking.openSettings();
      return;
    }
    await requestFn();
  };

  const finish = () => {
    if (!userId || isPending) return;

    mutate(userId, {
      onSuccess: () => router.replace("/(auth)/post-login"),
    });
  };

  return (
    <View style={{ flex: 1, padding: 20, gap: 16, justifyContent: "center" }}>
      <AppText style={{ fontSize: 26, fontWeight: "900", textAlign: "center" }}>
        Enable what helps you most
      </AppText>

      <AppText style={{ textAlign: "center", opacity: 0.8 }}>
        You can change these anytime in your phone settings. We’ll only use what
        you approve.
      </AppText>

      {/* Notifications */}
      <View style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <AppText style={{ fontSize: 18, fontWeight: "800" }}>
            Notifications
          </AppText>
          <StatusPill status={notif.status} />
        </View>

        <AppText style={{ opacity: 0.8 }}>
          Medication reminders, care follow-ups, and important updates.
        </AppText>

        <PillButton
          label={
            notif.status === "denied" ? "Open Settings" : "Enable Notifications"
          }
          onPress={() => requestOrSettings(notif.request, notif.status)}
          gradientColors={["#63D6C5", "#8A76FF"]}
          borderActive={false}
          textStyle={{ color: "white", fontWeight: "900" }}
          textContainerStyle={{ alignItems: "center" }}
          style={{ minHeight: 52 }}
        />
      </View>

      {/* Media */}
      <View style={{ gap: 8, marginTop: 8 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <AppText style={{ fontSize: 18, fontWeight: "800" }}>
            Photos & Videos
          </AppText>
          <StatusPill status={media.status} />
        </View>

        <AppText style={{ opacity: 0.8 }}>
          Attach media to logs to share clear information with clinicians.
        </AppText>

        <PillButton
          label={
            media.status === "denied" ? "Open Settings" : "Enable Media Access"
          }
          onPress={() => requestOrSettings(media.request, media.status)}
          gradientColors={["#63D6C5", "#8A76FF"]}
          borderActive={false}
          textStyle={{ color: "white", fontWeight: "900" }}
          textContainerStyle={{ alignItems: "center" }}
          style={{ minHeight: 52 }}
        />
      </View>

      {/* Continue */}
      <View style={{ marginTop: 18 }}>
        <PillButton
          label={isPending ? "Finishing..." : "Continue"}
          onPress={finish}
          borderActive={false}
          textStyle={{ color: "white", fontWeight: "900" }}
          gradientColors={["#8A76FF", "#63D6C5"]}
          style={{ minHeight: 56 }}
          textContainerStyle={{ alignItems: "center" }}
          disabled={!userId || isPending}
        />

        <Pressable onPress={finish} style={{ marginTop: 10 }}>
          <AppText style={{ textAlign: "center", opacity: 0.75 }}>
            Skip for now
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
