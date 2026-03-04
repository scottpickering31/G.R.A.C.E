import Loading from "@/components/Loading";
import { supabase } from "@/services/supabase";
import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import { GradientText } from "@/src/components/layout/LinearGradientText";
import Screen from "@/src/components/layout/Screen";
import { theme } from "@/src/theme";
import { authSchema, type AuthForm } from "@/state/auth.schema";
import { useUIStore } from "@/state/ui.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const { showLoading, hideLoading, showToast } = useUIStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: AuthForm) => {
    setSubmitting(true);
    showLoading("Logging you in...");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    hideLoading();
    setSubmitting(false);

    if (signInError) {
      showToast(signInError.message, "error");
      return;
    }
    router.replace("/(auth)/post-login");
  };

  if (submitting) return <Loading />;

  return (
    <Screen
      useSafeArea={true}
      screenBackground={require("@/assets/images/welcome-dreamscape.png")}
      contentStyle={styles.screenContent}
    >
      <View style={styles.header}>
        <GradientText
          colors={["#63D6C5", "#8A76FF"]}
          style={styles.title}
        >
          Welcome Back
        </GradientText>
        <AppText style={styles.subtitle}>
          Login to continue supporting care with G.R.A.C.E.
        </AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.field}>
          <AppText weight="semibold" style={styles.label}>
            Email
          </AppText>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor="rgba(31,45,61,0.45)"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            onChangeText={(t) => setValue("email", t, { shouldValidate: true })}
            {...register("email")}
          />
          {errors.email ? (
            <AppText style={styles.errorText}>{errors.email.message}</AppText>
          ) : null}
        </View>

        <View style={styles.field}>
          <AppText weight="semibold" style={styles.label}>
            Password
          </AppText>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="rgba(31,45,61,0.45)"
            secureTextEntry
            style={styles.input}
            onChangeText={(t) => setValue("password", t, { shouldValidate: true })}
            {...register("password")}
          />
          {errors.password ? (
            <AppText style={styles.errorText}>{errors.password.message}</AppText>
          ) : null}
        </View>

        <PillButton
          label="Login"
          onPress={handleSubmit(onSubmit)}
          gradientColors={["#63D6C5", "#8A76FF"]}
          borderActive={false}
          textStyle={styles.submitText}
          textContainerStyle={{ alignItems: "center" }}
          style={styles.submitButton}
        />

        <Pressable onPress={() => router.replace("/(auth)/signup")} style={styles.switchCta}>
          <AppText style={styles.switchText}>
            Need an account? <AppText weight="semibold">Sign up</AppText>
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
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 24,
    padding: 16,
    gap: 14,
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
  errorText: {
    color: "#C33E68",
    fontSize: theme.typography.fontSize.sm,
  },
  submitButton: {
    minHeight: 54,
    marginTop: 4,
  },
  submitText: {
    color: "white",
    fontWeight: "800",
    fontSize: theme.typography.fontSize.md,
  },
  switchCta: {
    marginTop: 2,
    paddingVertical: 6,
  },
  switchText: {
    textAlign: "center",
    color: theme.colors.text.secondary,
  },
});
