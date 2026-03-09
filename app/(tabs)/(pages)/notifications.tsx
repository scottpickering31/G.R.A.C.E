import Card from "@/components/layout/Card";
import Section from "@/components/layout/Section";
import {
  useOwnerPendingAccessRequests,
  useResolveAccessRequest,
} from "@/src/api/access/hooks";
import AppText from "@/src/components/AppText";
import PageSkeleton from "@/src/components/loading/PageSkeleton";
import Screen from "@/src/components/layout/Screen";
import { useAuthStore } from "@/src/state/auth.store";
import { useUIStore } from "@/state/ui.store";
import { theme } from "@/src/theme";
import { Bell, ShieldCheck } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

export default function NotificationsPage() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showToast } = useUIStore();
  const {
    data: pendingRequests,
    isLoading,
    refetch,
  } = useOwnerPendingAccessRequests(userId);
  const resolveAccessRequest = useResolveAccessRequest(undefined, userId);

  if (isLoading && !pendingRequests) {
    return <PageSkeleton sectionCount={1} rowCount={4} />;
  }

  return (
    <Screen
      screenBackground={require("@/assets/images/clouds.png")}
      useSafeArea={false}
    >
      <Section
        onRefresh={async () => {
          await refetch();
        }}
      >
        <Card
          padding="md"
          borderActive={true}
          elevationActive={true}
          style={styles.heroCard}
        >
          <View style={styles.heroRow}>
            <Bell size={16} color={theme.colors.brand.dark} />
            <AppText weight="bold" style={styles.heroTitle}>
              Notifications
            </AppText>
          </View>
          <AppText style={styles.heroSubtitle}>
            Access requests from caregivers, family, and clinicians.
          </AppText>
        </Card>

        <Card padding="md" borderActive={true} elevationActive={true}>
          <View style={styles.sectionHeader}>
            <AppText weight="semibold" style={styles.sectionTitle}>
              Access Requests
            </AppText>
            <View style={styles.countChip}>
              <ShieldCheck size={12} color="#1F6C45" />
              <AppText style={styles.countChipText}>
                {pendingRequests?.length ?? 0} pending
              </AppText>
            </View>
          </View>

          {!pendingRequests || pendingRequests.length === 0 ? (
            <AppText style={styles.emptyText}>
              No pending access requests right now.
            </AppText>
          ) : (
            pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestRow}>
                <AppText style={styles.requestTitle}>
                  {request.patientName} • {request.requesterUserId.slice(0, 8)}...
                </AppText>
                <AppText style={styles.requestMeta}>
                  {new Date(request.createdAt).toLocaleString()}
                </AppText>
                <AppText style={styles.requestMeta}>
                  Requested: {request.requestedRole === "caregiver" ? "Full Access" : "Read-only"}
                </AppText>
                {request.note ? (
                  <AppText style={styles.requestMeta}>Note: {request.note}</AppText>
                ) : null}

                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.rejectBtn}
                    disabled={resolveAccessRequest.isPending}
                    onPress={async () => {
                      try {
                        await resolveAccessRequest.mutateAsync({
                          request,
                          approve: false,
                        });
                        showToast("Request rejected.", "info");
                      } catch (e: any) {
                        showToast(e?.message ?? "Could not reject request.", "error");
                      }
                    }}
                  >
                    <AppText style={styles.rejectBtnText}>Reject</AppText>
                  </Pressable>
                  <Pressable
                    style={styles.approveBtn}
                    disabled={resolveAccessRequest.isPending}
                    onPress={async () => {
                      try {
                        await resolveAccessRequest.mutateAsync({
                          request,
                          approve: true,
                        });
                        showToast("Read-only access approved.", "success");
                      } catch (e: any) {
                        showToast(e?.message ?? "Could not approve request.", "error");
                      }
                    }}
                  >
                    <AppText style={styles.approveBtnText}>Approve</AppText>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "rgba(234,243,251,0.85)",
    borderColor: "rgba(74,144,226,0.18)",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  heroSubtitle: {
    marginTop: 4,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
  },
  countChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(47,133,90,0.22)",
    backgroundColor: "rgba(47,133,90,0.10)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countChipText: {
    color: "#1F6C45",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  emptyText: {
    marginTop: 8,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  requestRow: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(255,255,255,0.88)",
    padding: 10,
  },
  requestTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  requestMeta: {
    marginTop: 3,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  actionsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(209,67,67,0.22)",
    backgroundColor: "rgba(209,67,67,0.10)",
    paddingVertical: 8,
    alignItems: "center",
  },
  approveBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(47,133,90,0.24)",
    backgroundColor: "rgba(47,133,90,0.10)",
    paddingVertical: 8,
    alignItems: "center",
  },
  rejectBtnText: {
    color: "#A13232",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  approveBtnText: {
    color: "#1F6C45",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
});
