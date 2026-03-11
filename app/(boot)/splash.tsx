import SplashAnimation from "@/src/animations/splash/SplashAnimation";
import AppText from "@/src/components/AppText";
import PillButton from "@/src/components/buttons/PillButton";
import { theme } from "@/src/theme";
import { useAuthStore } from "@/state/auth.store";
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito-sans";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
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

  const logoSize = Math.min(Math.max(width * 0.4, 156), 228);

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <SplashAnimation onDone={() => setBgFinished(true)} />
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(56,38,20,0.02)",
              "rgba(56,38,20,0.10)",
              "rgba(28,34,19,0.30)",
              "rgba(20,24,16,0.56)",
            ]}
            locations={[0, 0.35, 0.68, 1]}
            style={styles.sceneVeil}
          />

          {/* keep mounted; just fade it in */}
          {bgFinished && (
            <Animated.View
              pointerEvents={bgFinished ? "auto" : "none"}
              style={[styles.hero]}
              entering={FadeIn.duration(300)}
              exiting={FadeOut}
            >
              <View style={styles.logoWrap}>
                <Image
                  source={require("../../assets/images/splash-logo.png")}
                  style={{ width: logoSize, height: logoSize }}
                  resizeMode="contain"
                />
              </View>

              <Animated.View
                entering={FadeInDown.duration(500).delay(120)}
                style={styles.heroContent}
              >
                <AppText weight="bold" style={styles.title}>
                  A gentler way to stay on top of care.
                </AppText>

                <AppText style={styles.subtitle}>
                  Keep medications, routines, and patient updates in one calm
                  place so the people helping can stay in sync.
                </AppText>

                <View style={styles.buttonSlot}>
                  {readyForContinue ? (
                    <PillButton
                      label="Enter G.R.A.C.E"
                      onPress={handlePress}
                      gradientColors={["#63D6C5", "#8A76FF"]}
                      borderActive={false}
                      textStyle={styles.buttonText}
                      textContainerStyle={{ alignItems: "center" }}
                      style={styles.button}
                    />
                  ) : (
                    <View style={styles.loadingChip}>
                      <AppText weight="semibold" style={styles.loadingChipText}>
                        Preparing secure sign-in...
                      </AppText>
                    </View>
                  )}
                </View>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const BUTTON_HEIGHT = 52;

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },

  container: {
    flex: 1,
    alignItems: "center",
  },

  sceneVeil: {
    ...StyleSheet.absoluteFillObject,
  },

  hero: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  logoWrap: {
    zIndex: 2,
    marginBottom: -34,
  },

  heroContent: {
    width: "100%",
    maxWidth: 460,
    paddingHorizontal: 22,
    paddingTop: 52,
    paddingBottom: 22,
    alignItems: "flex-start",
  },

  kickerText: {
    color: "#FFF4DE",
    fontSize: theme.typography.fontSize.xs,
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 16,
    fontSize: theme.typography.fontSize["2xl"],
    lineHeight: 36,
    color: "#FFF9F0",
    letterSpacing: 0.2,
  },

  subtitle: {
    marginTop: 10,
    fontSize: theme.typography.fontSize.md,
    color: "rgba(255,244,221,0.88)",
    lineHeight: 24,
  },

  buttonSlot: {
    height: BUTTON_HEIGHT,
    marginTop: 22,
    width: "100%",
    justifyContent: "center",
  },

  button: {
    minHeight: BUTTON_HEIGHT + 2,
    width: "100%",
  },

  buttonText: {
    fontSize: theme.typography.fontSize.lg,
    color: "white",
    fontWeight: "700",
  },

  loadingChip: {
    minHeight: BUTTON_HEIGHT,
    width: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,244,221,0.20)",
    backgroundColor: "rgba(255,244,221,0.12)",
  },

  loadingChipText: {
    color: "#FFF4DE",
    fontSize: theme.typography.fontSize.sm,
  },
});
