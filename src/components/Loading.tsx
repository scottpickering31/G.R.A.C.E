import { useUIStore } from "@/state/ui.store";
import { ActivityIndicator, View } from "react-native";
import AppText from "./AppText";

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
      {message ? <AppText style={{ opacity: 0.7 }}>{message}</AppText> : null}
    </View>
  );
}
