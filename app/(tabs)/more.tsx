import AppText from "@/src/components/AppText";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

const ITEMS = [
  { label: "Medical Plans", href: "/(tabs)/(pages)/medical-plans" },
  { label: "Care Circle", href: "/(tabs)/(pages)/care-circle" },
  { label: "Profiles", href: "/(tabs)/(pages)/profiles" },
  { label: "Notes, Logs & Media", href: "/(tabs)/(pages)/notes-logs-media" },
  { label: "Emergency", href: "/(tabs)/(pages)/emergency" },
  { label: "Allergies & Alerts", href: "/(tabs)/(pages)/allergies-alerts" },
] as const;

export default function More() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <AppText style={{ fontSize: 24, fontWeight: "800" }}>More</AppText>

      {ITEMS.map((item) => (
        <Pressable
          key={item.href}
          onPress={() => router.push(item.href)}
          style={{ padding: 14, borderRadius: 14, borderWidth: 1 }}
        >
          <AppText style={{ fontSize: 16, fontWeight: "600" }}>
            {item.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
