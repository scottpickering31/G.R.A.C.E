import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable } from "react-native";

export default function BackToHomeButton() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome =
    pathname === "/(tabs)" || pathname === "/(tabs)/index" || pathname === "/";

  return (
    <Pressable
      onPress={() => {
        if (!isHome) router.back();
      }}
      style={{ paddingHorizontal: 12 }}
    >
      {isHome ? (
        <Ionicons name="home-outline" size={22} color="#1F2937" />
      ) : (
        <Ionicons name="chevron-back" size={26} color="#1F2937" />
      )}
    </Pressable>
  );
}
