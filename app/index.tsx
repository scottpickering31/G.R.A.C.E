import Loading from "@/components/Loading";
import { useAuthStore } from "@/state/auth.store";
import { useUIStore } from "@/state/ui.store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function Splash() {
  const router = useRouter();
  const [loadingLocal, setLoadingLocal] = useState(false);

  const { showLoading, hideLoading } = useUIStore();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);

  const handlePress = async () => {
    setLoadingLocal(true);
    showLoading("Checking your session...");

    // Ensure auth hydration happened (first app open)
    // If it hasn’t yet, wait briefly for it.
    const start = Date.now();
    while (!hydrated && Date.now() - start < 1200) {
      await new Promise((r) => setTimeout(r, 50));
    }

    hideLoading();
    // Don't setLoadingLocal(false) – we navigate away and avoid flicker.

    if (session) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/signup");
    }
  };

  if (loadingLocal) return <Loading />;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 18, opacity: 0.8 }}>
        Guided Response And Care Environment
      </Text>
      {/* <Text style={{ fontSize: 44, fontWeight: "800" }}>G.R.A.C.E</Text> */}

      <Pressable
        onPress={handlePress}
        style={{
          marginTop: 16,
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 12,
          borderWidth: 1,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          Press to continue
        </Text>
      </Pressable>
    </View>
  );
}
