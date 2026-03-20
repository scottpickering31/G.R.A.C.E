import { supabase } from "@/services/supabase";
import { useMyAccessRequests, useRequestReadOnlyAccess } from "@/src/api/access/hooks";
import { useAccessiblePatients } from "@/src/api/medications/hooks";
import { useIsOnboardingCompleted } from "@/src/api/onboarding/hooks";
import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import MonthCalendarModal from "@/src/components/calendar/MonthCalendarModal";
import { GradientText } from "@/src/components/layout/LinearGradientText";
import Screen from "@/src/components/layout/Screen";
import { theme } from "@/src/theme";
import { useAuthStore } from "@/state/auth.store";
import { useUIStore } from "@/state/ui.store";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { Calendar, CircleCheck, User } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SexOption = "female" | "male" | "other" | "prefer_not_to_say";
const CONNECT_CODE_CELL_COUNT = 12;
const CONNECT_CODE_CELL_SIZE = 30;
const CONNECT_CODE_CELL_GAP = 6;
const CONNECT_CODE_GROUP_GAP = 8;
const CONNECT_CODE_LEADING_WIDTH = 64;
const CONNECT_CODE_SCROLL_PADDING = 48;

function formatISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDobDefaultDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 20);
  return d;
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
    cellOffset -
    CONNECT_CODE_CELL_SIZE -
    viewportWidth +
    CONNECT_CODE_SCROLL_PADDING;

  return Math.max(0, targetX);
}

export default function CreatePatientProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showLoading, hideLoading, showToast } = useUIStore();

  const [name, setName] = useState("");
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [sex, setSex] = useState<SexOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectSecretCode, setConnectSecretCode] = useState("");
  const [connectCodeViewportWidth, setConnectCodeViewportWidth] = useState(0);
  const [requestedCodePreview, setRequestedCodePreview] = useState<string | null>(null);
  const connectCodeScrollRef = useRef<ScrollView | null>(null);
  const requestAccess = useRequestReadOnlyAccess(userId);
  const { data: myAccessRequests } = useMyAccessRequests(userId);
  const { data: accessiblePatients } = useAccessiblePatients(userId);
  const { data: onboardingCompleted } = useIsOnboardingCompleted(userId);
  const connectCodeRef = useBlurOnFulfill({
    value: connectSecretCode,
    cellCount: CONNECT_CODE_CELL_COUNT,
  });

  const canContinue = useMemo(
    () => name.trim().length > 0 && !!userId && !saving,
    [name, userId, saving],
  );
  const linkedAccessRequest = useMemo(() => {
    const requests = myAccessRequests ?? [];
    return (
      requests.find((request) => request.status === "approved") ??
      requests.find((request) => request.status === "pending") ??
      null
    );
  }, [myAccessRequests]);
  const linkedPatient = useMemo(
    () =>
      accessiblePatients?.find(
        (patient) => patient.id === linkedAccessRequest?.patientId,
      ) ?? null,
    [accessiblePatients, linkedAccessRequest?.patientId],
  );
  const linkedRequestCode =
    linkedAccessRequest?.requestedCode ?? requestedCodePreview;
  const isLinkedProfileApproved = linkedAccessRequest?.status === "approved";
  const isLinkedProfilePending = linkedAccessRequest?.status === "pending";
  const showLinkedAccessState =
    isLinkedProfilePending ||
    (isLinkedProfileApproved && !!linkedPatient) ||
    (!!requestedCodePreview && !requestAccess.isPending);
  const linkedProfileName = linkedPatient?.display_name ?? "linked profile";
  const continueLabel =
    onboardingCompleted === false
      ? `Continue setup for ${linkedProfileName}`
      : `Continue with ${linkedProfileName}`;

  useEffect(() => {
    if (!showConnectModal) return;
    const timer = setTimeout(() => {
      connectCodeRef.current?.focus();
      connectCodeScrollRef.current?.scrollTo({ x: 0, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [showConnectModal, connectCodeRef]);

  useEffect(() => {
    if (!showConnectModal) return;
    const activeIndex = Math.max(
      0,
      Math.min(connectSecretCode.length, CONNECT_CODE_CELL_COUNT - 1),
    );
    const nextX = getConnectCodeScrollX(activeIndex, connectCodeViewportWidth);
    const timer = setTimeout(() => {
      connectCodeScrollRef.current?.scrollTo({ x: nextX, animated: true });
    }, 30);
    return () => clearTimeout(timer);
  }, [connectSecretCode, connectCodeViewportWidth, showConnectModal]);

  useEffect(() => {
    if (linkedAccessRequest?.requestedCode) {
      setRequestedCodePreview(null);
      return;
    }
    if (myAccessRequests && !linkedAccessRequest) {
      setRequestedCodePreview(null);
    }
  }, [linkedAccessRequest, myAccessRequests]);

  const createOwnedPatient = async () => {
    if (!userId) {
      showToast("Please sign in again to continue.", "error");
      router.replace("/(auth)/signup");
      return;
    }

    const displayName = name.trim();
    if (!displayName) {
      showToast("Please add a patient name.", "error");
      return;
    }

    const dobValue = dobDate ? formatISODate(dobDate) : null;
    const sexValue = sex === "prefer_not_to_say" ? null : sex;

    try {
      setSaving(true);
      showLoading("Creating patient profile...");

      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          created_by: userId,
          display_name: displayName,
          dob: dobValue,
          sex: sexValue,
        })
        .select("id")
        .single();

      if (patientError) throw patientError;

      const { error: memberError } = await supabase
        .from("patient_members")
        .insert({
          patient_id: patient.id,
          user_id: userId,
          role: "owner",
        });

      if (memberError && memberError.code !== "23505") throw memberError;

      showToast("Patient profile created.", "success");
      router.replace("/(auth)/post-login");
    } catch (e: any) {
      showToast(e?.message ?? "Could not create patient profile.", "error");
    } finally {
      hideLoading();
      setSaving(false);
    }
  };

  const connectToExistingPatientProfile = async () => {
    if (!userId) {
      showToast("Please sign in again to continue.", "error");
      router.replace("/(auth)/signup");
      return;
    }

    const normalizedCode = normalizePatientCodeInput(connectSecretCode);
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
    const code = formatPatientCode(normalizedCode);

    try {
      showLoading("Sending access request...");
      await requestAccess.mutateAsync({ code, requestedRole: "read_only" });
      setRequestedCodePreview(code);
      showToast("Access request sent. Awaiting owner approval.", "success");
      setShowConnectModal(false);
      setConnectSecretCode("");
    } catch (e: any) {
      showToast(e?.message ?? "Could not send access request.", "error");
    } finally {
      hideLoading();
    }
  };

  const continueWithLinkedProfile = () => {
    router.replace("/(auth)/post-login");
  };

  const pasteConnectCodeFromClipboard = async () => {
    const clipboardValue = await Clipboard.getStringAsync();
    const pastedCode = extractPatientCode(clipboardValue ?? "");

    if (!pastedCode) {
      showToast("Clipboard does not contain a valid patient code.", "error");
      return;
    }

    setConnectSecretCode(pastedCode);
    showToast("Patient code pasted from clipboard.", "success");
  };

  return (
    <Screen
      useSafeArea={true}
      screenBackground={require("@/assets/images/welcome-dreamscape.png")}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.screenContent,
          { paddingBottom: Math.max(insets.bottom + 24, 36) },
        ]}
      >
        <View style={styles.header}>
          <GradientText colors={["#63D6C5", "#8A76FF"]} style={styles.title}>
            Create Patient Profile
          </GradientText>
          <AppText style={styles.subtitle}>
            Start with key details. You can edit and add more later.
          </AppText>
        </View>

        {showLinkedAccessState ? (
          <View style={styles.waitingCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <User size={22} color="#4A90E2" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="semibold" style={styles.sectionTitle}>
                  {isLinkedProfileApproved
                    ? "Access approved"
                    : "Waiting for approval"}
                </AppText>
                <AppText style={styles.sectionHint}>
                  {isLinkedProfileApproved
                    ? `${linkedProfileName} is now available on your account.`
                    : "The profile owner needs to approve your request before you can continue."}
                </AppText>
              </View>
            </View>

            <View style={styles.waitingStatusPill}>
              <AppText weight="semibold" style={styles.waitingStatusText}>
                {isLinkedProfileApproved ? "Approved" : "Pending"}
              </AppText>
            </View>

            <AppText style={styles.waitingBodyText}>
              {isLinkedProfileApproved
                ? `You can continue once you're ready${linkedRequestCode ? ` for code ${linkedRequestCode}` : ""}.`
                : `Waiting for the owner of code ${linkedRequestCode ?? "PT-XXXX-XXXX-XXXX"} to accept your request.`}
            </AppText>

            {isLinkedProfileApproved ? (
              <PillButton
                label={continueLabel}
                onPress={continueWithLinkedProfile}
                gradientColors={["#27D6C5", "#7C6CFF"]}
                borderActive={false}
                textStyle={styles.primaryCtaText}
                textContainerStyle={{ alignItems: "center" }}
                style={styles.primaryCta}
              />
            ) : (
              <AppText style={styles.waitingHintText}>
                This page checks your request status automatically.
              </AppText>
            )}
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <User size={22} color="#4A90E2" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="semibold" style={styles.sectionTitle}>
                    Primary patient details
                  </AppText>
                  <AppText style={styles.sectionHint}>
                    This profile is linked to your account as owner.
                  </AppText>
                </View>
              </View>

              <Field
                label="Patient name *"
                placeholder="e.g. Katie Smith"
                value={name}
                onChangeText={setName}
              />

              <Field
                label="Date of birth (optional)"
                placeholder="Select from calendar"
                value={dobDate ? formatISODate(dobDate) : ""}
                rightIcon={<Calendar size={18} color="rgba(31,45,61,0.55)" />}
                onPress={() => setCalendarVisible(true)}
              />

              <AppText weight="semibold" style={styles.fieldLabel}>
                Sex (optional)
              </AppText>
              <View style={styles.chipsRow}>
                {(
                  [
                    ["female", "Female"],
                    ["male", "Male"],
                    ["other", "Other"],
                    ["prefer_not_to_say", "Prefer not to say"],
                  ] as [SexOption, string][]
                ).map(([value, label]) => {
                  const active = sex === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setSex(value)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <AppText
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.ctaBlock}>
              <PillButton
                label={
                  saving
                    ? "Creating..."
                    : canContinue
                      ? "Create & Continue"
                      : "Enter a name to continue"
                }
                onPress={createOwnedPatient}
                disabled={!canContinue}
                gradientColors={["#27D6C5", "#7C6CFF"]}
                borderActive={false}
                textStyle={styles.primaryCtaText}
                textContainerStyle={{ alignItems: "center" }}
                style={styles.primaryCta}
              />

              <PillButton
                label="Connect to an existing patient profile"
                onPress={() => setShowConnectModal(true)}
                borderActive={true}
                elevationActive={false}
                textStyle={styles.secondaryCtaText}
                textContainerStyle={{ alignItems: "center" }}
                style={styles.secondaryCta}
              />

              <View style={styles.trustRow}>
                <CircleCheck size={16} color="rgba(31,45,61,0.55)" />
                <AppText style={styles.trustText}>
                  You can update patient details later from Profiles.
                </AppText>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <MonthCalendarModal
        visible={calendarVisible}
        initialDate={dobDate ?? getDobDefaultDate()}
        onClose={() => setCalendarVisible(false)}
        onSelect={(selected) => {
          const today = new Date();
          const selectedMidnight = new Date(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate(),
          );
          const todayMidnight = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );

          if (selectedMidnight > todayMidnight) {
            showToast("Date of birth cannot be in the future.", "error");
            return;
          }

          setDobDate(selectedMidnight);
          setCalendarVisible(false);
        }}
      />

      <Modal
        transparent
        visible={showConnectModal}
        animationType="fade"
        onRequestClose={() => setShowConnectModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowConnectModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <AppText weight="bold" style={styles.modalTitle}>
              Connect to Existing Patient
            </AppText>
            <AppText style={styles.modalSubtitle}>
              Enter the patient secret code shared by the profile owner.
            </AppText>

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
                  value={connectSecretCode}
                  onChangeText={(value) =>
                    setConnectSecretCode(normalizePatientCodeInput(value))
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
              Type the 12-character code only. The PT prefix and dashes are
              added for you.
            </AppText>
            <Pressable
              style={styles.pasteCodeBtn}
              onPress={pasteConnectCodeFromClipboard}
            >
              <AppText weight="semibold" style={styles.pasteCodeBtnText}>
                Paste From Clipboard
              </AppText>
            </Pressable>

            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setShowConnectModal(false);
                  setConnectSecretCode("");
                }}
              >
                <AppText weight="semibold">Cancel</AppText>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryBtn}
                disabled={requestAccess.isPending}
                onPress={connectToExistingPatientProfile}
              >
                <AppText weight="semibold" style={styles.modalPrimaryBtnText}>
                  {requestAccess.isPending ? "Sending..." : "Send Request"}
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function Field({
  label,
  placeholder,
  value,
  rightIcon,
  onPress,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  value: string;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  onChangeText?: (t: string) => void;
}) {
  const calendarOnly = !!onPress && !onChangeText;

  return (
    <View style={styles.field}>
      <AppText weight="semibold" style={styles.fieldLabel}>
        {label}
      </AppText>
      <Pressable
        style={styles.inputWrap}
        onPress={onPress}
        disabled={!calendarOnly}
      >
        <TextInput
          value={value}
          editable={!calendarOnly}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(31,45,61,0.4)"
          style={styles.input}
        />
        {rightIcon ? <View style={styles.inputIcon}>{rightIcon}</View> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 6,
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    textAlign: "center",
    fontSize: theme.typography.fontSize.md,
    color: "rgba(31,45,61,0.78)",
  },
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  waitingCard: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74, 144, 226, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.25)",
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
  sectionHint: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  waitingStatusPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(74,144,226,0.12)",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.24)",
  },
  waitingStatusText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
  },
  waitingBodyText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
  },
  waitingHintText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  field: { gap: 6 },
  fieldLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
  inputIcon: {
    marginLeft: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
  },
  chipActive: {
    backgroundColor: "rgba(124,108,255,0.18)",
    borderColor: "rgba(124,108,255,0.42)",
  },
  chipText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#5A3CD2",
  },
  ctaBlock: {
    gap: 10,
    marginTop: 4,
  },
  primaryCta: {
    minHeight: 56,
  },
  primaryCtaText: {
    color: "white",
    fontSize: theme.typography.fontSize.md,
    fontWeight: "800",
  },
  secondaryCta: {
    minHeight: 52,
  },
  secondaryCtaText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: "700",
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  trustText: {
    color: "rgba(31,45,61,0.65)",
    fontSize: theme.typography.fontSize.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 14,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  modalSubtitle: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  modalInput: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  codeInputShell: {
    marginTop: 10,
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
  modalActionRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  modalSecondaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 9,
    alignItems: "center",
  },
  modalPrimaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingVertical: 9,
    alignItems: "center",
  },
  modalPrimaryBtnText: {
    color: theme.colors.brand.dark,
  },
});
