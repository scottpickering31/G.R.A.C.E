import { useRouter } from "expo-router";
import { Calendar, Camera, CircleCheck, User } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import { GradientText } from "@/src/components/layout/LinearGradientText";
import Screen from "@/src/components/layout/Screen";
import { theme } from "@/src/theme";

type Gender = "Female" | "Male" | "Other" | "Prefer not to say";

export default function CreatePatientProfile() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [diagnosis, setDiagnosis] = useState("");

  const canContinue = useMemo(() => name.trim().length > 0, [name]);

  return (
    <Screen
      useSafeArea={true}
      screenBackground={require("@/assets/images/welcome-dreamscape.png")}
      contentStyle={{ paddingHorizontal: 15, paddingTop: 18, gap: 14 }}
    >
      {/* Title */}
      <View style={{ alignItems: "center", paddingHorizontal: 6 }}>
        <GradientText
          colors={["#63D6C5", "#8A76FF"]}
          style={{ fontSize: theme.typography.fontSize["2xl"] }}
        >
          Create a Patient Profile
        </GradientText>
        <AppText style={styles.subtitle}>
          Add just the basics now — you can fill in details later.
        </AppText>
      </View>

      {/* Main glass card */}
      <View style={styles.glassCard}>
        {/* Photo row */}
        <View style={styles.photoRow}>
          <View style={styles.photoCircle}>
            <User size={26} color="rgba(117, 24, 173, 0.85)" />
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.sectionTitle}>
              Patient photo (optional)
            </AppText>
            <AppText style={styles.sectionHint}>
              Helps caregivers quickly pick the right profile.
            </AppText>
          </View>

          <Pressable style={styles.photoButton} onPress={() => {}}>
            <Camera size={18} color="rgba(117, 24, 173, 0.9)" />
            <AppText style={styles.photoButtonText}>Add</AppText>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Inputs */}
        <Field
          label="Patient name *"
          placeholder="e.g. Katie"
          value={name}
          onChangeText={setName}
        />

        <Field
          label="Date of birth (optional)"
          placeholder="DD / MM / YYYY"
          value={dob}
          onChangeText={setDob}
          rightIcon={<Calendar size={18} color="rgba(31,41,55,0.55)" />}
        />

        <AppText style={styles.fieldLabel}>Gender (optional)</AppText>
        <View style={styles.chipsRow}>
          {(["Female", "Male", "Other", "Prefer not to say"] as Gender[]).map(
            (g) => {
              const active = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <AppText
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {g}
                  </AppText>
                </Pressable>
              );
            },
          )}
        </View>

        <Field
          label="Diagnosis / condition (optional)"
          placeholder="e.g. Epilepsy, SYNGAP1, etc."
          value={diagnosis}
          onChangeText={setDiagnosis}
        />
      </View>

      {/* CTA */}
      <View style={{ marginTop: 6, gap: 10 }}>
        <PillButton
          label={canContinue ? "Continue" : "Enter a name to continue"}
          onPress={() => {
            if (!canContinue) return;

            // TODO: Save to DB
            // - create patient row
            // - create membership row
            router.push("/(onboarding)/permissions");
          }}
          gradientColors={["#27D6C5", "#7C6CFF"]}
          borderActive={false}
          elevationActive={true}
          textStyle={{
            color: "white",
            fontWeight: "800",
            fontSize: 18,
          }}
          textContainerStyle={{ alignItems: "center" }}
          style={{
            minHeight: 58,
            paddingVertical: 16,
            opacity: canContinue ? 1 : 0.6,
          }}
        />

        <View style={{ alignItems: "center" }}>
          <View style={styles.trustRow}>
            <CircleCheck size={16} color="rgba(31,41,55,0.55)" />
            <AppText style={styles.trustText}>
              You can edit this anytime from Patient Profiles.
            </AppText>
          </View>
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
    <View style={{ gap: 3 }}>
      <AppText style={styles.fieldLabel}>{label}</AppText>

      <View style={styles.inputWrap}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(31,41,55,0.35)"
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
        />
        {rightIcon ? <View style={{ marginLeft: 8 }}>{rightIcon}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },

  skipPill: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },

  skipText: {
    color: "rgba(31,41,55,0.7)",
    fontWeight: "700",
  },

  title: {
    fontSize: theme.typography.fontSize["xl"],
    fontWeight: "900",
    color: "#243B45",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 6,
    fontSize: theme.typography.fontSize.md,
    fontWeight: "600",
    color: "rgba(36,59,69,0.75)",
    textAlign: "center",
    lineHeight: 22,
  },

  heroImage: {
    width: "100%",
    height: 210,
    marginTop: 6,
    opacity: 0.95,
  },

  glassCard: {
    borderRadius: 26,
    padding: 16,
    backgroundColor: "rgba(255, 232, 255, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },

  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  photoCircle: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },

  photoButton: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
  },

  photoButtonText: {
    fontWeight: "800",
    color: "rgba(117, 24, 173, 0.9)",
  },

  sectionTitle: {
    fontWeight: "800",
    color: "#243B45",
  },

  sectionHint: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(36,59,69,0.7)",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.65)",
    marginTop: 14,
  },

  fieldLabel: {
    marginTop: 10,
    fontWeight: "800",
    color: "#243B45",
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },

  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#243B45",
    paddingVertical: 2,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
  },

  chipActive: {
    backgroundColor: "rgba(124, 108, 255, 0.18)",
    borderColor: "rgba(124, 108, 255, 0.35)",
  },

  chipText: {
    fontWeight: "800",
    color: "rgba(36,59,69,0.8)",
    fontSize: 13,
  },

  chipTextActive: {
    color: "rgba(90, 60, 210, 0.95)",
  },

  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },

  trustText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(31,41,55,0.6)",
  },
});
