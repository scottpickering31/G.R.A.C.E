import Card from "@/components/layout/Card";
import Section from "@/components/layout/Section";
import {
  usePatientAccessCode,
  usePendingAccessRequestsForPatient,
  useResolveAccessRequest,
} from "@/src/api/access/hooks";
import {
  useDeletePatientProfile,
  usePatientProfileDetails,
} from "@/src/api/medications/hooks";
import AppText from "@/src/components/AppText";
import PageSkeleton from "@/src/components/loading/PageSkeleton";
import Screen from "@/src/components/layout/Screen";
import { useAuthStore } from "@/src/state/auth.store";
import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import * as Clipboard from "expo-clipboard";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  CalendarDays,
  Copy,
  Eye,
  EyeOff,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

function formatDob(dob: string | null) {
  if (!dob) return "Not set";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleDateString();
}

function formatSex(sex: string | null) {
  if (!sex) return "Not set";
  return sex
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roleLabel(role: "owner" | "caregiver" | "clinician" | "read_only") {
  if (role === "read_only") return "Read-only";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function PatientProfileDetailsPage() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showToast } = useUIStore();
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [showDeleteOwnerModal, setShowDeleteOwnerModal] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const params = useLocalSearchParams<{ patientId?: string | string[] }>();
  const patientId = Array.isArray(params.patientId)
    ? params.patientId[0]
    : params.patientId;

  const { data, isLoading } = usePatientProfileDetails(userId, patientId);
  const isOwner = data?.role === "owner";
  const deletePatientProfileMutation = useDeletePatientProfile(userId);
  const { data: patientAccessCode } = usePatientAccessCode(
    data?.id,
    userId,
    !!isOwner,
  );
  const { data: pendingRequests } = usePendingAccessRequestsForPatient(
    isOwner ? data?.id : undefined,
  );
  const resolveAccessRequestMutation = useResolveAccessRequest(
    isOwner ? data?.id : undefined,
    userId,
  );
  const expectedDeletePhrase = data
    ? `DELETE ${data.display_name.toUpperCase()}`
    : "";
  const deletePhraseMatches =
    deletePhrase.trim().toUpperCase() === expectedDeletePhrase;

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowSecretCode(false);
        setShowDeleteOwnerModal(false);
        setDeletePhrase("");
      };
    }, []),
  );

  if (isLoading) {
    return <PageSkeleton sectionCount={3} rowCount={2} />;
  }

  return (
    <Screen
      screenBackground={require("@/assets/images/clouds.png")}
      useSafeArea={false}
    >
      <Section>
        <Card
          padding="md"
          borderActive={true}
          elevationActive={true}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <UserRound size={18} color={theme.colors.brand.dark} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" style={styles.heroTitle}>
                {data?.display_name ?? "Patient Profile"}
              </AppText>
              <AppText style={styles.heroSubtitle}>
                Patient details and care profile information.
              </AppText>
            </View>
            {data?.isActive ? (
              <View style={styles.activeBadge}>
                <ShieldCheck size={12} color="#1F6C45" />
                <AppText style={styles.activeBadgeText}>Active</AppText>
              </View>
            ) : null}
          </View>
        </Card>

        {!data ? (
          <Card padding="md" borderActive={true} elevationActive={true}>
            <View style={styles.emptyWrap}>
              <AppText style={styles.emptyText}>
                Patient details are not available or you do not have access.
              </AppText>
            </View>
          </Card>
        ) : (
          <>
            <Card padding="md" borderActive={true} elevationActive={true}>
              <AppText weight="semibold" style={styles.sectionTitle}>
                Profile Details
              </AppText>

              <View style={styles.infoRow}>
                <CalendarDays size={14} color={theme.colors.text.secondary} />
                <AppText style={styles.infoText}>
                  DOB: {formatDob(data.dob)}
                </AppText>
              </View>

              <AppText style={styles.infoText}>
                Sex: {formatSex(data.sex)}
              </AppText>
              <AppText style={styles.infoText}>
                Access Role: {roleLabel(data.role)}
              </AppText>
            </Card>

            <Card padding="md" borderActive={true} elevationActive={true}>
              <AppText weight="semibold" style={styles.sectionTitle}>
                Care Team & Access
              </AppText>
              {isOwner ? (
                <View style={styles.secretCodeWrap}>
                  <View style={styles.secretHeaderRow}>
                    <AppText style={styles.secretLabel}>
                      Patient Secret Code
                    </AppText>
                    <Pressable
                      style={styles.secretEyeBtn}
                      onPress={() => setShowSecretCode((prev) => !prev)}
                    >
                      {showSecretCode ? (
                        <EyeOff size={15} color={theme.colors.text.secondary} />
                      ) : (
                        <Eye size={15} color={theme.colors.text.secondary} />
                      )}
                    </Pressable>
                  </View>
                  <AppText selectable={true} style={styles.secretValue}>
                    {showSecretCode
                      ? patientAccessCode ?? "Generating..."
                      : "●●●●-●●●●-●●●●"}
                  </AppText>
                  <AppText style={styles.helperText}>
                    Share this code with family or clinicians for access to{" "}
                    {data?.display_name ?? "Patient Profile"}
                  </AppText>

                  <View style={styles.secretActionsRow}>
                    <Pressable
                      style={styles.secretActionBtn}
                      onPress={async () => {
                        if (!patientAccessCode) return;
                        await Clipboard.setStringAsync(patientAccessCode);
                        showToast("Patient code copied.", "success");
                      }}
                    >
                      <Copy size={14} color={theme.colors.brand.dark} />
                      <AppText weight="semibold" style={styles.secretActionText}>
                        Copy Code
                      </AppText>
                    </Pressable>

                    <Pressable
                      style={styles.secretActionBtn}
                      onPress={async () => {
                        if (!patientAccessCode) return;
                        await Share.share({
                          message: `${data.display_name} access code: ${patientAccessCode}`,
                        });
                      }}
                    >
                      <Send size={14} color={theme.colors.brand.dark} />
                      <AppText weight="semibold" style={styles.secretActionText}>
                        Share Code
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <AppText style={styles.helperText}>
                  Only patient owners can view and share the secret code.
                </AppText>
              )}
            </Card>

            {isOwner ? (
              <Card padding="md" borderActive={true} elevationActive={true}>
                <AppText weight="semibold" style={styles.sectionTitle}>
                  Access Requests
                </AppText>
                {!pendingRequests || pendingRequests.length === 0 ? (
                  <AppText style={styles.helperText}>
                    No pending read-only access requests.
                  </AppText>
                ) : (
                  pendingRequests.map((request) => (
                    <View key={request.id} style={styles.requestRow}>
                      <AppText style={styles.requestUserText}>
                        User: {request.requesterUserId.slice(0, 8)}...
                      </AppText>
                      <AppText style={styles.requestMetaText}>
                        Requested: {new Date(request.createdAt).toLocaleString()}
                      </AppText>
                      <AppText style={styles.requestMetaText}>
                        Requested Role:{" "}
                        {request.requestedRole === "caregiver"
                          ? "Full Access"
                          : "Read-only"}
                      </AppText>
                      {request.note ? (
                        <AppText style={styles.requestMetaText}>
                          Note: {request.note}
                        </AppText>
                      ) : null}
                      <View style={styles.requestActionsRow}>
                        <Pressable
                          style={styles.requestRejectBtn}
                          disabled={resolveAccessRequestMutation.isPending}
                          onPress={async () => {
                            try {
                              await resolveAccessRequestMutation.mutateAsync({
                                request,
                                approve: false,
                              });
                              showToast("Request rejected.", "info");
                            } catch (e: any) {
                              showToast(e?.message ?? "Could not reject request.", "error");
                            }
                          }}
                        >
                          <AppText style={styles.requestRejectBtnText}>Reject</AppText>
                        </Pressable>
                        <Pressable
                          style={styles.requestApproveBtn}
                          disabled={resolveAccessRequestMutation.isPending}
                          onPress={async () => {
                            try {
                              await resolveAccessRequestMutation.mutateAsync({
                                request,
                                approve: true,
                              });
                              showToast("Read-only access approved.", "success");
                            } catch (e: any) {
                              showToast(e?.message ?? "Could not approve request.", "error");
                            }
                          }}
                        >
                          <AppText style={styles.requestApproveBtnText}>Approve</AppText>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </Card>
            ) : null}

            <Card padding="md" borderActive={true} elevationActive={true}>
              <AppText weight="semibold" style={styles.sectionTitle}>
                Profile Actions
              </AppText>
              <AppText style={styles.helperText}>
                {isOwner
                  ? "Deleting as owner permanently removes this patient for all linked users."
                  : "This removes your linked access only. The owner and other members keep access."}
              </AppText>
              <Pressable
                style={styles.deleteProfileBtn}
                disabled={deletePatientProfileMutation.isPending || !data || !userId}
                onPress={() => {
                  if (!data || !userId) return;
                  if (isOwner) {
                    setDeletePhrase("");
                    setShowDeleteOwnerModal(true);
                    return;
                  }
                  const actionLabel = isOwner
                    ? "Delete Patient Profile"
                    : "Remove Linked Profile";
                  const confirmMessage = isOwner
                    ? `This will permanently delete ${data.display_name} for all users with access.`
                    : `This will remove ${data.display_name} from your account only.`;

                  Alert.alert(actionLabel, confirmMessage, [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: actionLabel,
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await deletePatientProfileMutation.mutateAsync({
                            userId,
                            patientId: data.id,
                          });
                          showToast(
                            isOwner
                              ? "Patient profile deleted."
                              : "Linked profile removed.",
                            "success",
                          );
                          router.replace("/(tabs)/(pages)/patient-profiles");
                        } catch (e: any) {
                          showToast(
                            e?.message ??
                              "Could not delete this patient profile.",
                            "error",
                          );
                        }
                      },
                    },
                  ]);
                }}
              >
                <AppText style={styles.deleteProfileBtnText}>
                  {deletePatientProfileMutation.isPending
                    ? "Processing..."
                    : isOwner
                      ? "Delete Patient Profile"
                      : "Remove Linked Profile"}
                </AppText>
              </Pressable>
            </Card>

            <Modal
              visible={showDeleteOwnerModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => {
                if (deletePatientProfileMutation.isPending) return;
                setShowDeleteOwnerModal(false);
                setDeletePhrase("");
              }}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.deleteModalCard}>
                  <AppText weight="semibold" style={styles.deleteModalTitle}>
                    Delete Patient Profile
                  </AppText>
                  <AppText style={styles.deleteModalBody}>
                    This action is permanent. Type{" "}
                    <AppText weight="bold" style={styles.deleteModalCode}>
                      {expectedDeletePhrase}
                    </AppText>{" "}
                    to continue.
                  </AppText>
                  <TextInput
                    value={deletePhrase}
                    onChangeText={setDeletePhrase}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder={expectedDeletePhrase}
                    placeholderTextColor={theme.colors.text.secondary}
                    style={styles.deleteInput}
                  />
                  <View style={styles.deleteModalActions}>
                    <Pressable
                      style={styles.deleteModalCancelBtn}
                      disabled={deletePatientProfileMutation.isPending}
                      onPress={() => {
                        setShowDeleteOwnerModal(false);
                        setDeletePhrase("");
                      }}
                    >
                      <AppText style={styles.deleteModalCancelText}>
                        Cancel
                      </AppText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.deleteModalConfirmBtn,
                        deletePhraseMatches
                          ? styles.deleteModalConfirmBtnEnabled
                          : styles.deleteModalConfirmBtnDisabled,
                      ]}
                      disabled={
                        deletePatientProfileMutation.isPending ||
                        !deletePhraseMatches ||
                        !data ||
                        !userId
                      }
                      onPress={async () => {
                        if (!data || !userId || !deletePhraseMatches) return;
                        try {
                          await deletePatientProfileMutation.mutateAsync({
                            userId,
                            patientId: data.id,
                          });
                          setShowDeleteOwnerModal(false);
                          setDeletePhrase("");
                          showToast("Patient profile deleted.", "success");
                          router.replace("/(tabs)/(pages)/patient-profiles");
                        } catch (e: any) {
                          showToast(
                            e?.message ?? "Could not delete this patient profile.",
                            "error",
                          );
                        }
                      }}
                    >
                      <AppText style={styles.deleteModalConfirmText}>
                        {deletePatientProfileMutation.isPending
                          ? "Processing..."
                          : "Delete Patient"}
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "rgba(234,243,251,0.85)",
    borderColor: "rgba(74,144,226,0.18)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.13)",
  },
  heroTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  heroSubtitle: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  activeBadge: {
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
  activeBadgeText: {
    color: "#1F6C45",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: theme.typography.fontSize.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    marginTop: 6,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  helperText: {
    marginTop: 6,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  secretCodeWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.20)",
    backgroundColor: "rgba(74,144,226,0.07)",
    padding: 10,
  },
  secretHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  secretEyeBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  secretLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  secretValue: {
    marginTop: 4,
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  secretActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  secretActionBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secretActionText: {
    color: theme.colors.brand.dark,
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
  requestUserText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  requestMetaText: {
    marginTop: 3,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  requestActionsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  requestRejectBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(209,67,67,0.22)",
    backgroundColor: "rgba(209,67,67,0.10)",
    paddingVertical: 8,
    alignItems: "center",
  },
  requestApproveBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(47,133,90,0.24)",
    backgroundColor: "rgba(47,133,90,0.10)",
    paddingVertical: 8,
    alignItems: "center",
  },
  requestRejectBtnText: {
    color: "#A13232",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  requestApproveBtnText: {
    color: "#1F6C45",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  emptyWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    backgroundColor: "rgba(255,255,255,0.68)",
    padding: 12,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  deleteProfileBtn: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(197,48,48,0.25)",
    backgroundColor: "rgba(197,48,48,0.10)",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  deleteProfileBtnText: {
    color: "#C53030",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(12,18,28,0.45)",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 14,
  },
  deleteModalTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
  deleteModalBody: {
    marginTop: 8,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  deleteModalCode: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  deleteInput: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    backgroundColor: "rgba(248,251,255,0.9)",
    paddingHorizontal: 10,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  deleteModalActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  deleteModalCancelBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    backgroundColor: "rgba(245,247,251,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalCancelText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
  },
  deleteModalConfirmBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalConfirmBtnDisabled: {
    borderWidth: 1,
    borderColor: "rgba(135,145,158,0.26)",
    backgroundColor: "rgba(180,190,204,0.2)",
  },
  deleteModalConfirmBtnEnabled: {
    borderWidth: 1,
    borderColor: "rgba(197,48,48,0.45)",
    backgroundColor: "#C53030",
  },
  deleteModalConfirmText: {
    color: "#FFFFFF",
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
});
