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
import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import * as Clipboard from "expo-clipboard";
import { ShieldCheck, UsersRound } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
} from "react-native-confirmation-code-field";

const CONNECT_CODE_CELL_COUNT = 12;
const CONNECT_CODE_CELL_SIZE = 30;
const CONNECT_CODE_CELL_GAP = 6;
const CONNECT_CODE_GROUP_GAP = 8;
const CONNECT_CODE_LEADING_WIDTH = 64;
const CONNECT_CODE_SCROLL_PADDING = 48;

function statusLabel(
  status: "pending" | "approved" | "rejected" | "cancelled",
) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function normalizePatientCodeInput(value: string) {
  return value
    .toUpperCase()
    .replace(/^PT-?/, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

function formatPatientCode(value: string) {
  const normalized = normalizePatientCodeInput(value);
  if (normalized.length !== 12) return normalized;
  return `PT-${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}`;
}

function extractPatientCode(value: string) {
  const upperValue = value.toUpperCase();
  const formattedMatch = upperValue.match(
    /PT[^A-Z0-9]*([A-Z0-9]{4})[^A-Z0-9]*([A-Z0-9]{4})[^A-Z0-9]*([A-Z0-9]{4})/,
  );
  if (formattedMatch) {
    return `${formattedMatch[1]}${formattedMatch[2]}${formattedMatch[3]}`;
  }

  const rawMatch = upperValue.match(
    /(?:^|[^A-Z0-9])([A-Z0-9]{12})(?:[^A-Z0-9]|$)/,
  );
  if (rawMatch) return rawMatch[1];

  const normalized = normalizePatientCodeInput(upperValue);
  return normalized.length === 12 ? normalized : "";
}

function getConnectCodeScrollX(activeIndex: number, viewportWidth: number) {
  if (viewportWidth <= 0) return 0;

  const clampedIndex = Math.max(
    0,
    Math.min(activeIndex, CONNECT_CODE_CELL_COUNT - 1),
  );
  const completedGroupBreaks = Math.floor(clampedIndex / 4);
  const cellOffset =
    clampedIndex * (CONNECT_CODE_CELL_SIZE + CONNECT_CODE_CELL_GAP) +
    completedGroupBreaks * CONNECT_CODE_GROUP_GAP;
  const targetX =
    CONNECT_CODE_LEADING_WIDTH +
    cellOffset +
    CONNECT_CODE_CELL_SIZE -
    viewportWidth +
    CONNECT_CODE_SCROLL_PADDING;

  return Math.max(0, targetX);
}

export default function CareCircle() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showToast } = useUIStore();
  const [secretCode, setSecretCode] = useState("");
  const [note, setNote] = useState("");
  const [requestedRole, setRequestedRole] = useState<"read_only" | "caregiver">(
    "read_only",
  );
  const [connectCodeViewportWidth, setConnectCodeViewportWidth] = useState(0);
  const connectCodeScrollRef = useRef<ScrollView | null>(null);
  const requestReadOnlyAccess = useRequestReadOnlyAccess(userId);
  const deleteMyRequest = useDeleteMyAccessRequest(userId);
  const revokeApprovedAccess = useRevokeOwnerApprovedAccess(userId);
  const { data: myRequests, refetch } = useMyAccessRequests(userId);
  const { data: ownerApprovedAccess, refetch: refetchOwnerApprovedAccess } =
    useOwnerApprovedAccess(userId);
  const connectCodeRef = useBlurOnFulfill({
    value: secretCode,
    cellCount: CONNECT_CODE_CELL_COUNT,
  });

  const pendingCount = useMemo(
    () => (myRequests ?? []).filter((r) => r.status === "pending").length,
    [myRequests],
  );
  const linkedMembers = ownerApprovedAccess ?? [];
  const currentRequests = useMemo(
    () => (myRequests ?? []).filter((r) => r.status !== "approved"),
    [myRequests],
  );
  const canDeleteRequest = (
    status: (typeof currentRequests)[number]["status"],
  ) => status === "pending" || status === "cancelled" || status === "rejected";

  useEffect(() => {
    const activeIndex = Math.max(
      0,
      Math.min(secretCode.length, CONNECT_CODE_CELL_COUNT - 1),
    );
    const nextX = getConnectCodeScrollX(activeIndex, connectCodeViewportWidth);
    const timer = setTimeout(() => {
      connectCodeScrollRef.current?.scrollTo({ x: nextX, animated: true });
    }, 30);
    return () => clearTimeout(timer);
  }, [secretCode, connectCodeViewportWidth]);

  const pasteSecretCodeFromClipboard = async () => {
    const clipboardValue = await Clipboard.getStringAsync();
    const pastedCode = extractPatientCode(clipboardValue ?? "");

    if (!pastedCode) {
      showToast("Clipboard does not contain a valid patient code.", "error");
      return;
    }

    setSecretCode(pastedCode);
    showToast("Patient code pasted from clipboard.", "success");
  };

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
            Request read-only or full access to a patient profile using their
            secret code or paste from clipboard.
          </AppText>
        </Card>

        <Card padding="md" borderActive={true} elevationActive={true}>
          <View style={styles.sectionHeader}>
            <AppText weight="semibold" style={styles.sectionTitle}>
              Request Access
            </AppText>
            <View style={styles.pendingChip}>
              <ShieldCheck size={12} color="#1F6C45" />
              <AppText style={styles.pendingChipText}>
                {pendingCount} pending
              </AppText>
            </View>
          </View>
          <View style={styles.codeInputShell}>
            <ScrollView
              ref={connectCodeScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={styles.codeInputRow}
              onLayout={(event) =>
                setConnectCodeViewportWidth(event.nativeEvent.layout.width)
              }
            >
              <View style={styles.codePrefixBadge}>
                <AppText weight="semibold" style={styles.codePrefixText}>
                  PT
                </AppText>
              </View>
              <AppText style={styles.codeSeparator}>-</AppText>
              <CodeField
                ref={connectCodeRef}
                value={secretCode}
                onChangeText={(value) =>
                  setSecretCode(normalizePatientCodeInput(value))
                }
                cellCount={CONNECT_CODE_CELL_COUNT}
                rootStyle={styles.codeFieldRoot}
                keyboardType="ascii-capable"
                autoCapitalize="characters"
                autoCorrect={false}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                renderCell={({ index, symbol, isFocused }) => (
                  <View
                    key={index}
                    style={[
                      styles.codeCell,
                      isFocused && styles.codeCellActive,
                      index < CONNECT_CODE_CELL_COUNT - 1 &&
                      (index + 1) % 4 === 0
                        ? styles.codeCellGroupGap
                        : null,
                    ]}
                  >
                    <AppText style={styles.codeCellText}>
                      {symbol || (isFocused ? <Cursor /> : "")}
                    </AppText>
                  </View>
                )}
              />
            </ScrollView>
          </View>
          <AppText style={styles.codeHelperText}>
            Type the 12-character secret code only. The PT prefix and dashes are
            added for you.
          </AppText>
          <Pressable
            style={styles.pasteCodeBtn}
            onPress={pasteSecretCodeFromClipboard}
          >
            <AppText weight="semibold" style={styles.pasteCodeBtnText}>
              Paste From Clipboard
            </AppText>
          </Pressable>
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
              const normalizedCode = normalizePatientCodeInput(secretCode);
              if (!normalizedCode) {
                showToast("Please enter a patient secret code.", "error");
                return;
              }
              if (normalizedCode.length !== 12) {
                showToast(
                  "Enter all 12 letters and numbers from the patient code.",
                  "error",
                );
                return;
              }

              try {
                await requestReadOnlyAccess.mutateAsync({
                  code: formatPatientCode(normalizedCode),
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
                  {request.requestedRole === "caregiver"
                    ? "Full Access"
                    : "Read-only"}
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
                        showToast(
                          e?.message ?? "Could not delete request.",
                          "error",
                        );
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
                <AppText style={styles.approvedName}>
                  {member.patientName}
                </AppText>
                <AppText style={styles.approvedMeta}>
                  User: {member.memberUserId.slice(0, 8)}...
                </AppText>
                <AppText style={styles.approvedMeta}>
                  Access:{" "}
                  {member.role === "caregiver" ? "Full Access" : "Read-only"}
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
                      showToast(
                        e?.message ?? "Could not remove access.",
                        "error",
                      );
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
  codeInputShell: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 12,
    gap: 10,
  },
  codeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 4,
  },
  codePrefixBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(74,144,226,0.12)",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.24)",
  },
  codePrefixText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.sm,
  },
  codeFieldRoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  codeCell: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "rgba(248,251,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  codeCellActive: {
    borderColor: "rgba(74,144,226,0.55)",
    backgroundColor: "rgba(74,144,226,0.16)",
  },
  codeCellGroupGap: {
    marginRight: 8,
  },
  codeCellText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
  codeSeparator: {
    color: "rgba(31,45,61,0.55)",
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "700",
  },
  codeHelperText: {
    marginTop: 8,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  pasteCodeBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pasteCodeBtnText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
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
