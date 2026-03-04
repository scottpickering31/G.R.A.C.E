import { useUIStore } from "@/state/ui.store";
import { ActivityIndicator, View } from "react-native";
import AppText from "./AppText";

export default function Loading() {
  const { loadingMessage } = useUIStore();

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
      {loadingMessage ? (
        <AppText style={{ opacity: 0.7 }}>{loadingMessage}</AppText>
      ) : null}
    </View>
  );
}
