import { useAuthStore } from "@/src/state/auth.store";
import { usePathname, useRouter } from "expo-router";
import { ChevronLeft, House } from "lucide-react-native";
import { Pressable } from "react-native";
import AppText from "../AppText";

export default function BackToHomeButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuthStore();

  const isHome =
    pathname === "/(tabs)" || pathname === "/(tabs)/index" || pathname === "/";

  // TEST
  const handlePress = () => {
    signOut();
    console.log("Signing Out");
    router.replace("/(auth)/login");
  };

  return (
    <Pressable
      onPress={() => {
        if (!isHome) router.back();
      }}
      style={{ paddingHorizontal: 15 }}
    >
      {isHome ? (
        <House size={26} color="#1F2937" />
      ) : (
        <ChevronLeft size={26} color="#1F2937" />
      )}
      <Pressable onPress={handlePress}>
        <AppText>Sign Out</AppText>
      </Pressable>
    </Pressable>
  );
}
