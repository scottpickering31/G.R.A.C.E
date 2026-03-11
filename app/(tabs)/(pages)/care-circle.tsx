import Card from "@/components/layout/Card";
import Section from "@/components/layout/Section";
import {
  useDeleteMyAccessRequest,
  useMyAccessRequests,
  useOwnerApprovedAccess,
  useRequestReadOnlyAccess,
  useRevokeOwnerApprovedAccess,
} from "@/src/api/access/hooks";
import AppText from "@/src/components/AppText";
import Screen from "@/src/components/layout/Screen";
import { useAuthStore } from "@/src/state/auth.store";
import { useUIStore } from "@/state/ui.store";
import { theme } from "@/src/theme";
import { ShieldCheck, UsersRound } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

function statusLabel(status: "pending" | "approved" | "rejected" | "cancelled") {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function CareCircle() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showToast } = useUIStore();
  const [secretCode, setSecretCode] = useState("");
  const [note, setNote] = useState("");
  const [requestedRole, setRequestedRole] = useState<"read_only" | "caregiver">(
    "read_only",
  );
  const requestReadOnlyAccess = useRequestReadOnlyAccess(userId);
  const deleteMyRequest = useDeleteMyAccessRequest(userId);
  const revokeApprovedAccess = useRevokeOwnerApprovedAccess(userId);
  const { data: myRequests, refetch } = useMyAccessRequests(userId);
  const { data: ownerApprovedAccess, refetch: refetchOwnerApprovedAccess } =
    useOwnerApprovedAccess(userId);

  const pendingCount = useMemo(
    () => (myRequests ?? []).filter((r) => r.status === "pending").length,
    [myRequests],
  );
  const linkedMembers = ownerApprovedAccess ?? [];
  const currentRequests = useMemo(
    () => (myRequests ?? []).filter((r) => r.status !== "approved"),
    [myRequests],
  );
  const canDeleteRequest = (status: typeof currentRequests[number]["status"]) =>
    status === "pending" || status === "cancelled" || status === "rejected";

  return (
    <Screen
      screenBackground={require("@/assets/images/clouds.png")}
      useSafeArea={false}
    >
      <Section
        onRefresh={async () => {
          await Promise.all([refetch(), refetchOwnerApprovedAccess()]);
        }}
      >
        <Card
          padding="md"
          borderActive={true}
          elevationActive={true}
          style={styles.heroCard}
        >
          <AppText weight="bold" style={styles.heroTitle}>
            Care Circle Access
          </AppText>
          <AppText style={styles.heroSubtitle}>
            Request read-only access to a patient profile using their secret code.
          </AppText>
        </Card>

        <Card padding="md" borderActive={true} elevationActive={true}>
          <View style={styles.sectionHeader}>
            <AppText weight="semibold" style={styles.sectionTitle}>
              Request Access
            </AppText>
            <View style={styles.pendingChip}>
              <ShieldCheck size={12} color="#1F6C45" />
              <AppText style={styles.pendingChipText}>{pendingCount} pending</AppText>
            </View>
          </View>
          <TextInput
            value={secretCode}
            onChangeText={(value) => setSecretCode(value.toUpperCase())}
            autoCapitalize="characters"
            placeholder="PT-XXXX-XXXX-XXXX"
            placeholderTextColor="rgba(31,45,61,0.45)"
            style={styles.input}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note (e.g. I'm the patient's GP)"
            placeholderTextColor="rgba(31,45,61,0.45)"
            style={[styles.input, styles.noteInput]}
            multiline
          />
          <View style={styles.roleChipsRow}>
            <Pressable
              style={[
                styles.roleChip,
                requestedRole === "read_only" && styles.roleChipActive,
              ]}
              onPress={() => setRequestedRole("read_only")}
            >
              <AppText
                style={[
                  styles.roleChipText,
                  requestedRole === "read_only" && styles.roleChipTextActive,
                ]}
              >
                Read-only
              </AppText>
            </Pressable>
            <Pressable
              style={[
                styles.roleChip,
                requestedRole === "caregiver" && styles.roleChipActive,
              ]}
              onPress={() => setRequestedRole("caregiver")}
            >
              <AppText
                style={[
                  styles.roleChipText,
                  requestedRole === "caregiver" && styles.roleChipTextActive,
                ]}
              >
                Full Access
              </AppText>
            </Pressable>
          </View>
          <Pressable
            style={styles.requestBtn}
            disabled={requestReadOnlyAccess.isPending}
            onPress={async () => {
              if (!secretCode.trim()) {
                showToast("Please enter a patient secret code.", "error");
                return;
              }
              try {
                await requestReadOnlyAccess.mutateAsync({
                  code: secretCode,
                  requestedRole,
                  note: note.trim() || undefined,
                });
                showToast("Access request submitted.", "success");
                setSecretCode("");
                setNote("");
                setRequestedRole("read_only");
              } catch (e: any) {
                showToast(e?.message ?? "Could not submit request.", "error");
              }
            }}
          >
            <UsersRound size={14} color={theme.colors.brand.dark} />
            <AppText weight="semibold" style={styles.requestBtnText}>
              {requestReadOnlyAccess.isPending
                ? "Submitting..."
                : requestedRole === "caregiver"
                  ? "Request Full Access"
                  : "Request Read-Only Access"}
            </AppText>
          </Pressable>
        </Card>

        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText weight="semibold" style={styles.sectionTitle}>
            My Requests
          </AppText>
          {!currentRequests || currentRequests.length === 0 ? (
            <AppText style={styles.emptyText}>No access requests yet.</AppText>
          ) : (
            currentRequests.map((request) => (
              <View key={request.id} style={styles.requestRow}>
                <AppText style={styles.requestIdText}>
                  Patient: {request.patientId.slice(0, 8)}...
                </AppText>
                <AppText style={styles.requestMetaText}>
                  Requested Access:{" "}
                  {request.requestedRole === "caregiver" ? "Full Access" : "Read-only"}
                </AppText>
                <AppText style={styles.requestMetaText}>
                  {new Date(request.createdAt).toLocaleString()}
                </AppText>
                <View style={styles.statusRow}>
                  <AppText style={styles.requestMetaText}>Status:</AppText>
                  <View
                    style={[
                      styles.statusBadge,
                      request.status === "pending" && styles.statusPending,
                      request.status === "approved" && styles.statusApproved,
                      request.status === "rejected" && styles.statusRejected,
                      request.status === "cancelled" && styles.statusCancelled,
                    ]}
                  >
                    <AppText style={styles.statusBadgeText}>
                      {statusLabel(request.status)}
                    </AppText>
                  </View>
                </View>
                {canDeleteRequest(request.status) ? (
                  <Pressable
                    style={styles.deleteBtn}
                    disabled={deleteMyRequest.isPending}
                    onPress={async () => {
                      try {
                        await deleteMyRequest.mutateAsync(request.id);
                        showToast(
                          request.status === "pending"
                            ? "Request revoked."
                            : "Request history deleted.",
                          "success",
                        );
                      } catch (e: any) {
                        showToast(e?.message ?? "Could not delete request.", "error");
                      }
                    }}
                  >
                    <AppText style={styles.deleteBtnText}>
                      {request.status === "pending"
                        ? "Revoke Request"
                        : "Delete History"}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </Card>

        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText weight="semibold" style={styles.sectionTitle}>
            Approved Patients
          </AppText>
          {linkedMembers.length === 0 ? (
            <AppText style={styles.emptyText}>
              No approved care-circle members linked to your patients yet.
            </AppText>
          ) : (
            linkedMembers.map((member) => (
              <View
                key={`${member.patientId}-${member.memberUserId}`}
                style={styles.approvedRow}
              >
                <AppText style={styles.approvedName}>{member.patientName}</AppText>
                <AppText style={styles.approvedMeta}>
                  User: {member.memberUserId.slice(0, 8)}...
                </AppText>
                <AppText style={styles.approvedMeta}>
                  Access: {member.role === "caregiver" ? "Full Access" : "Read-only"}
                </AppText>
                <AppText style={styles.approvedMeta}>
                  Linked: {new Date(member.createdAt).toLocaleString()}
                </AppText>
                <Pressable
                  style={styles.deleteBtn}
                  disabled={revokeApprovedAccess.isPending}
                  onPress={async () => {
                    try {
                      await revokeApprovedAccess.mutateAsync({
                        requestId: member.requestId,
                      });
                      showToast("Access removed.", "success");
                    } catch (e: any) {
                      showToast(e?.message ?? "Could not remove access.", "error");
                    }
                  }}
                >
                  <AppText style={styles.deleteBtnText}>Remove Access</AppText>
                </Pressable>
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
  pendingChip: {
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
  pendingChipText: {
    color: "#1F6C45",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    marginTop: 8,
  },
  noteInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  roleChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  roleChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.15)",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleChipActive: {
    borderColor: "rgba(74,144,226,0.24)",
    backgroundColor: "rgba(74,144,226,0.13)",
  },
  roleChipText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  roleChipTextActive: {
    color: theme.colors.brand.dark,
  },
  requestBtn: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  requestBtnText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
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
  requestIdText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  requestMetaText: {
    marginTop: 3,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  statusRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPending: {
    backgroundColor: "rgba(183,121,31,0.16)",
  },
  statusApproved: {
    backgroundColor: "rgba(47,133,90,0.16)",
  },
  statusRejected: {
    backgroundColor: "rgba(209,67,67,0.16)",
  },
  statusCancelled: {
    backgroundColor: "rgba(31,45,61,0.12)",
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  deleteBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(209,67,67,0.22)",
    backgroundColor: "rgba(209,67,67,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: "#A13232",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  approvedRow: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(255,255,255,0.88)",
    padding: 10,
  },
  approvedName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
  },
  approvedMeta: {
    marginTop: 3,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
});
