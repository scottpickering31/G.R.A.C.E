import Loading from "@/src/components/Loading";
import { supabase } from "@/services/supabase";
import AppText from "@/src/components/AppText";
import type { EmailOtpType } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

function extractAuthParams(url: string) {
  const [beforeHash, hashPart = ""] = url.split("#");
  const queryPart = beforeHash.split("?")[1] ?? "";
  const merged = [queryPart, hashPart].filter(Boolean).join("&");
  return new URLSearchParams(merged);
}

function isEmailOtpType(value: string): value is EmailOtpType {
  return ["signup", "invite", "magiclink", "recovery", "email_change", "email"].includes(value);
}

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const finishAuth = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (!initialUrl) {
          router.replace("/(auth)/login");
          return;
        }

        const params = extractAuthParams(initialUrl);
        const code = params.get("code");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        } else if (tokenHash && type && isEmailOtpType(type)) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
          });
          if (otpError) throw otpError;
        } else {
          throw new Error("Invalid or expired verification link.");
        }

        router.replace("/(auth)/post-login");
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "We could not verify your email link.");
      }
    };

    finishAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!error) return <Loading />;

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <AppText style={{ fontSize: 18, fontWeight: "800", textAlign: "center" }}>
        Verification failed
      </AppText>
      <AppText style={{ textAlign: "center", opacity: 0.75 }}>{error}</AppText>
      <Pressable
        onPress={() => router.replace("/(auth)/login")}
        style={{ paddingVertical: 12, borderRadius: 12, backgroundColor: "#111" }}
      >
        <AppText style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
          Back to Login
        </AppText>
      </Pressable>
    </View>
  );
}
