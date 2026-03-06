import { usePathname, useRouter } from "expo-router";
import { ChevronLeft, House } from "lucide-react-native";
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
      style={{ paddingHorizontal: 15 }}
    >
      {isHome ? (
        <House size={26} color="#1F2937" />
      ) : (
        <ChevronLeft size={26} color="#1F2937" />
      )}
    </Pressable>
  );
}
