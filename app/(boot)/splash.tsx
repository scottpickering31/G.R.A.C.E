import SplashAnimation from "@/src/animations/splash/SplashAnimation";
import AppText from "@/src/components/AppText";
import { theme } from "@/src/theme";
import { useAuthStore } from "@/state/auth.store";
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito-sans";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Splash() {
  const [bgFinished, setBgFinished] = useState(false);
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  const hydrated = useAuthStore((s) => s.hydrated);
  const readyForContinue = fontsLoaded && hydrated;

  const handlePress = () => {
    if (!readyForContinue) return;
    router.replace("/(auth)/post-login");
  };

  const logoSize = Math.min(Math.max(width * 0.5, 180), 290);

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <SplashAnimation onDone={() => setBgFinished(true)} />

          {/* keep mounted; just fade it in */}
          {bgFinished && (
            <Animated.View
              pointerEvents={bgFinished ? "auto" : "none"}
              style={[styles.hero]}
              entering={FadeIn.duration(300)}
              exiting={FadeOut}
            >
              <Image
                source={require("../../assets/images/splash-logo.png")}
                style={{ width: logoSize, height: logoSize }}
                resizeMode="contain"
              />

              <View style={styles.heroContent}>
                <AppText weight="bold" style={styles.title}>
                  G.R.A.C.E
                </AppText>

                <AppText style={styles.subtitle}>
                  Guided Response & Care Environment
                </AppText>

                <View style={styles.buttonSlot}>
                  {readyForContinue && (
                    <Pressable onPress={handlePress} style={styles.button}>
                      <AppText weight="semibold" style={styles.buttonText}>
                        Press to continue
                      </AppText>
                    </Pressable>
                  )}
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const BUTTON_HEIGHT = 52;

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: theme.colors.bg.info },
  safeArea: { flex: 1 },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  hero: {
    alignItems: "center",
    width: "100%",
  },

  heroContent: {
    marginTop: -16,
    width: "88%",
    maxWidth: 420,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },

  title: {
    fontSize: theme.typography.fontSize["3xl"],
    letterSpacing: 3,
    color: "#3D2E84",
    textShadowColor: "rgba(255,255,255,0.95)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  subtitle: {
    marginTop: 6,
    fontSize: theme.typography.fontSize.lg,
    textAlign: "center",
    color: "rgba(47, 33, 105, 0.84)",
    lineHeight: 24,
    fontWeight: "700",
  },

  buttonSlot: {
    height: BUTTON_HEIGHT,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    minHeight: BUTTON_HEIGHT,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: "rgba(138, 118, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#7B61FF",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  buttonText: {
    fontSize: theme.typography.fontSize.md,
    color: "white",
    letterSpacing: 0.4,
  },
});
