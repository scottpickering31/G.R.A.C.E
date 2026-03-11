import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import { X } from "lucide-react-native";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { FullWindowOverlay } from "react-native-screens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "./AppText";

const TOAST_HIDE_MS = 4500;

export default function Toast() {
  const { toastVisible, toastMessage, toastType, hideToast } = useUIStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toastVisible) return;

    const timeout = setTimeout(() => {
      hideToast();
    }, TOAST_HIDE_MS);

    return () => clearTimeout(timeout);
  }, [toastVisible, hideToast]);

  if (!toastVisible || !toastMessage) return null;

  const OverlayHost = Platform.OS === "ios" ? FullWindowOverlay : View;

  return (
    <OverlayHost>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View
          pointerEvents="box-none"
          style={[styles.host, { top: Math.max(insets.top + 12, 54) }]}
        >
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
            <View style={styles.contentRow}>
              <AppText weight="semibold" style={styles.text}>
                {toastMessage}
              </AppText>
              <Pressable
                onPress={hideToast}
                hitSlop={10}
                style={styles.closeButton}
              >
                <X size={16} color="rgba(255,255,255,0.92)" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </OverlayHost>
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
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  text: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
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
