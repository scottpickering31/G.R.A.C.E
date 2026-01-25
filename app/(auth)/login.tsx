import Loading from "@/components/Loading";
import { supabase } from "@/services/supabase";
import { authSchema, type AuthForm } from "@/state/auth.schema";
import { useUIStore } from "@/state/ui.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, Text, TextInput, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const { showLoading, hideLoading } = useUIStore();
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

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    hideLoading();
    setSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/(tabs)");
  };

  if (submitting) return <Loading />;

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "800" }}>Login</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}
        onChangeText={(t) => setValue("email", t, { shouldValidate: true })}
        {...register("email")}
      />
      {errors.email ? (
        <Text style={{ color: "crimson" }}>{errors.email.message}</Text>
      ) : null}

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}
        onChangeText={(t) => setValue("password", t, { shouldValidate: true })}
        {...register("password")}
      />
      {errors.password ? (
        <Text style={{ color: "crimson" }}>{errors.password.message}</Text>
      ) : null}

      <Pressable
        onPress={handleSubmit(onSubmit)}
        style={{
          marginTop: 10,
          backgroundColor: "#111",
          padding: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
          Login
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(auth)/signup")}
        style={{ padding: 10 }}
      >
        <Text style={{ textAlign: "center", opacity: 0.8 }}>
          Need an account? <Text style={{ fontWeight: "700" }}>Sign up</Text>
        </Text>
      </Pressable>
    </View>
  );
}
