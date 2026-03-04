import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import AppText from "./AppText";

const TOAST_HIDE_MS = 4500;

export default function Toast() {
  const { toastVisible, toastMessage, toastType, hideToast } = useUIStore();

  useEffect(() => {
    if (!toastVisible) return;

    const timeout = setTimeout(() => {
      hideToast();
    }, TOAST_HIDE_MS);

    return () => clearTimeout(timeout);
  }, [toastVisible, hideToast]);

  if (!toastVisible || !toastMessage) return null;

  return (
    <View pointerEvents="none" style={styles.host}>
      <View
        style={[
          styles.toast,
          toastType === "success"
            ? styles.success
            : toastType === "error"
              ? styles.error
              : styles.info,
        ]}
      >
        <AppText weight="semibold" style={styles.text}>
          {toastMessage}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 54,
    zIndex: 999,
  },
  toast: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 5,
  },
  text: {
    color: "#FFFFFF",
    fontSize: theme.typography.fontSize.sm,
    textAlign: "center",
  },
  success: {
    backgroundColor: "#2F8F78",
    borderColor: "rgba(255,255,255,0.25)",
  },
  error: {
    backgroundColor: "#C24C66",
    borderColor: "rgba(255,255,255,0.25)",
  },
  info: {
    backgroundColor: theme.colors.brand.dark,
    borderColor: "rgba(255,255,255,0.25)",
  },
});
