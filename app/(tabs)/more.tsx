import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

const ITEMS = [
  { label: "Medical Plans", href: "/(tabs)/(pages)/medical-plans" },
  { label: "Care Circle", href: "/(tabs)/(pages)/care-circle" },
  { label: "Profiles", href: "/(tabs)/(pages)/profiles" },
  { label: "Notes, Logs & Media", href: "/(tabs)/(pages)/notes-logs-media" },
  { label: "Emergency", href: "/(tabs)/(pages)/emergency" },
] as const;

export default function More() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "800" }}>More</Text>

      {ITEMS.map((item) => (
        <Pressable
          key={item.href}
          onPress={() => router.push(item.href)}
          style={{ padding: 14, borderRadius: 14, borderWidth: 1 }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
