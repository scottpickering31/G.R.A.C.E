import Loading from "@/components/Loading";
import { supabase } from "@/services/supabase";
import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import { GradientText } from "@/src/components/layout/LinearGradientText";
import Screen from "@/src/components/layout/Screen";
import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyCode() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = String(params.email ?? "").trim().toLowerCase();

  const { showLoading, hideLoading, showToast } = useUIStore();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const verify = async () => {
    if (!email) {
      showToast("Missing email. Please go back and try again.", "error");
      router.replace("/(auth)/signup");
      return;
    }

    if (code.length !== CODE_LENGTH) {
      showToast("Enter the 6-digit code from your email.", "error");
      return;
    }

    setSubmitting(true);
    showLoading("Verifying your code...");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    hideLoading();
    setSubmitting(false);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    router.replace("/(auth)/post-login");
  };

  const resendCode = async () => {
    if (!email || cooldown > 0) return;

    showLoading("Sending another code...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: Linking.createURL("callback"),
      },
    });
    hideLoading();

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setCooldown(RESEND_COOLDOWN_SECONDS);
    showToast("New code sent.", "success");
  };

  if (submitting) return <Loading />;

  return (
    <Screen
      useSafeArea={true}
      screenBackground={require("@/assets/images/welcome-dreamscape.png")}
      contentStyle={styles.screenContent}
    >
      <View style={styles.header}>
        <GradientText colors={["#63D6C5", "#8A76FF"]} style={styles.title}>
          Enter Verification Code
        </GradientText>
        <AppText style={styles.subtitle}>
          Enter the 6-digit code sent to {email || "your email"}.
        </AppText>
      </View>

      <View style={styles.card}>
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          keyboardType="number-pad"
          placeholder="000000"
          placeholderTextColor="rgba(31,45,61,0.35)"
          style={styles.codeInput}
          maxLength={CODE_LENGTH}
        />

        <PillButton
          label="Verify & Continue"
          onPress={verify}
          gradientColors={["#63D6C5", "#8A76FF"]}
          borderActive={false}
          textStyle={styles.verifyText}
          textContainerStyle={{ alignItems: "center" }}
          style={styles.verifyButton}
        />

        <Pressable
          onPress={resendCode}
          disabled={cooldown > 0}
          style={styles.resendButton}
        >
          <AppText style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </AppText>
        </Pressable>

        <Pressable onPress={() => router.replace("/(auth)/signup")}>
          <AppText style={styles.backText}>Change email</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 16,
  },
  header: {
    paddingHorizontal: 10,
    alignItems: "center",
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    textAlign: "center",
    fontSize: theme.typography.fontSize.md,
    color: "rgba(31,45,61,0.75)",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  codeInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: theme.typography.fontSize["2xl"],
    letterSpacing: 8,
    textAlign: "center",
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  verifyButton: {
    minHeight: 54,
  },
  verifyText: {
    color: "white",
    fontWeight: "800",
    fontSize: theme.typography.fontSize.md,
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendText: {
    textAlign: "center",
    color: theme.colors.brand.dark,
    fontWeight: "700",
  },
  resendTextDisabled: {
    color: theme.colors.text.muted,
  },
  backText: {
    textAlign: "center",
    color: theme.colors.text.secondary,
    textDecorationLine: "underline",
  },
});
