import { useUIStore } from "@/state/ui.store";
import { ActivityIndicator, Text, View } from "react-native";

export default function Loading() {
  const { message } = useUIStore();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <ActivityIndicator size="large" />
      {message ? <Text style={{ opacity: 0.7 }}>{message}</Text> : null}
    </View>
  );
}
