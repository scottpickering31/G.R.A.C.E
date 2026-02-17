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

  const logoSize = Math.min(Math.max(width * 0.42, 600), 300);

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

  title: {
    fontSize: theme.typography.fontSize["3xl"],
    letterSpacing: theme.typography.letterSpacing.brand,
    color: theme.colors.text.primary,
    textShadowColor: "rgb(255, 255, 255)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  subtitle: {
    marginTop: 10,
    fontSize: theme.typography.fontSize.lg,
    textAlign: "center",
    color: theme.colors.text.primary,
    fontWeight: "600",
    textShadowColor: "rgb(255, 255, 255)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },

  buttonSlot: {
    height: BUTTON_HEIGHT,
    marginTop: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    minHeight: BUTTON_HEIGHT,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },

  buttonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
});
