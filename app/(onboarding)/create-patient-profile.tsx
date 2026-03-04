import { supabase } from "@/services/supabase";
import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import { GradientText } from "@/src/components/layout/LinearGradientText";
import Screen from "@/src/components/layout/Screen";
import { theme } from "@/src/theme";
import { useAuthStore } from "@/state/auth.store";
import { useUIStore } from "@/state/ui.store";
import { useRouter } from "expo-router";
import { Calendar, CircleCheck, User } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type SexOption = "female" | "male" | "other" | "prefer_not_to_say";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function CreatePatientProfile() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showLoading, hideLoading, showToast } = useUIStore();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<SexOption | null>(null);
  const [saving, setSaving] = useState(false);

  const canContinue = useMemo(
    () => name.trim().length > 0 && !!userId && !saving,
    [name, userId, saving],
  );

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

    const normalizedDob = dob.trim();
    let dobValue: string | null = null;
    if (normalizedDob) {
      if (!ISO_DATE_REGEX.test(normalizedDob)) {
        showToast("Date of birth must use YYYY-MM-DD format.", "error");
        return;
      }
      const parsed = new Date(`${normalizedDob}T00:00:00Z`);
      const isValidDate =
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === normalizedDob;
      if (!isValidDate) {
        showToast("Please enter a valid calendar date.", "error");
        return;
      }
      dobValue = normalizedDob;
    }

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

      const { error: memberError } = await supabase.from("patient_members").insert({
        patient_id: patient.id,
        user_id: userId,
        role: "owner",
      });

      // If membership was auto-created by DB logic, treat duplicate key as success.
      if (memberError && memberError.code !== "23505") throw memberError;

      showToast("Patient profile created.", "success");
      router.push("/(onboarding)/permissions");
    } catch (e: any) {
      showToast(e?.message ?? "Could not create patient profile.", "error");
    } finally {
      hideLoading();
      setSaving(false);
    }
  };

  return (
    <Screen
      useSafeArea={true}
      screenBackground={require("@/assets/images/welcome-dreamscape.png")}
      contentStyle={styles.screenContent}
    >
      <View style={styles.header}>
        <GradientText colors={["#63D6C5", "#8A76FF"]} style={styles.title}>
          Create Patient Profile
        </GradientText>
        <AppText style={styles.subtitle}>
          Start with key details. You can edit and add more later.
        </AppText>
      </View>

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
          placeholder="YYYY-MM-DD"
          value={dob}
          onChangeText={setDob}
          rightIcon={<Calendar size={18} color="rgba(31,45,61,0.55)" />}
        />

        <AppText weight="semibold" style={styles.fieldLabel}>
          Sex (optional)
        </AppText>
        <View style={styles.chipsRow}>
          {([
            ["female", "Female"],
            ["male", "Male"],
            ["other", "Other"],
            ["prefer_not_to_say", "Prefer not to say"],
          ] as [SexOption, string][]).map(([value, label]) => {
            const active = sex === value;
            return (
              <Pressable
                key={value}
                onPress={() => setSex(value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <AppText style={[styles.chipText, active && styles.chipTextActive]}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.ctaBlock}>
        <PillButton
          label={saving ? "Creating..." : canContinue ? "Create & Continue" : "Enter a name to continue"}
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
          onPress={() => showToast("Caregiver connect flow coming next.", "info")}
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
    </Screen>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  rightIcon,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  rightIcon?: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <AppText weight="semibold" style={styles.fieldLabel}>
        {label}
      </AppText>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(31,45,61,0.4)"
          style={styles.input}
        />
        {rightIcon ? <View style={styles.inputIcon}>{rightIcon}</View> : null}
      </View>
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
});
