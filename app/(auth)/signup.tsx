import { supabase } from "@/services/supabase";
import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import { GradientText } from "@/src/components/layout/LinearGradientText";
import Screen from "@/src/components/layout/Screen";
import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import { Ionicons } from "@expo/vector-icons";
import type { Provider } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractAuthParams(url: string) {
  const [beforeHash, hashPart = ""] = url.split("#");
  const queryPart = beforeHash.split("?")[1] ?? "";
  const merged = [queryPart, hashPart].filter(Boolean).join("&");
  return new URLSearchParams(merged);
}

export default function AuthEntry() {
  const router = useRouter();
  const { showLoading, hideLoading, showToast } = useUIStore();
  const [email, setEmail] = useState("");

  const sendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      showToast("Enter a valid email address first.", "error");
      return;
    }

    showLoading("Sending your verification code...");
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
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

    showToast("We sent a 6-digit code to your email.", "success");
    router.push({
      pathname: "/(auth)/verify-code",
      params: { email: normalizedEmail },
    });
  };

  const startOAuth = async (provider: Provider) => {
    try {
      showLoading(`Opening ${provider === "apple" ? "Apple" : "Google"}...`);
      const redirectTo = Linking.createURL("callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL returned.");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      if (result.type !== "success" || !result.url) {
        hideLoading();
        showToast("Sign-in was canceled.", "info");
        return;
      }

      const params = extractAuthParams(result.url);
      const code = params.get("code");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      } else {
        throw new Error("Could not complete OAuth session.");
      }

      hideLoading();
      router.replace("/(auth)/post-login");
    } catch (e: any) {
      hideLoading();
      showToast(e?.message ?? "OAuth sign-in failed.", "error");
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
          Continue to G.R.A.C.E
        </GradientText>
        <AppText style={styles.subtitle}>
          One secure page for sign up and login.
        </AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.field}>
          <AppText weight="semibold" style={styles.label}>
            Email
          </AppText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="rgba(31,45,61,0.45)"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <AppText style={styles.helperText}>
            We’ll send a 6-digit code to verify your email.
          </AppText>
        </View>

        <PillButton
          label="Continue with Email Code"
          onPress={sendCode}
          gradientColors={["#63D6C5", "#8A76FF"]}
          borderActive={false}
          textStyle={styles.primaryButtonText}
          textContainerStyle={{ alignItems: "center" }}
          style={styles.primaryButton}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <AppText style={styles.dividerText}>or</AppText>
          <View style={styles.divider} />
        </View>

        <Pressable
          onPress={() => startOAuth("apple")}
          style={styles.oauthButton}
        >
          <Ionicons name="logo-apple" size={20} color="#1F2D3D" />
          <AppText weight="semibold" style={styles.oauthText}>
            Continue with Apple
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => startOAuth("google")}
          style={styles.oauthButton}
        >
          <Ionicons name="logo-google" size={20} color="#1F2D3D" />
          <AppText weight="semibold" style={styles.oauthText}>
            Continue with Google
          </AppText>
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
  field: { gap: 6 },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  helperText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  primaryButton: {
    minHeight: 54,
    marginTop: 4,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: theme.typography.fontSize.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.ui.divider,
  },
  dividerText: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.sm,
  },
  oauthButton: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  oauthText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
});
