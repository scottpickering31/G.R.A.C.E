import Loading from "@/components/Loading";
import AppText from "@/src/components/AppText";
import { theme } from "@/src/theme";
import { useAuthStore } from "@/state/auth.store";
import { useUIStore } from "@/state/ui.store";
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito-sans";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Splash() {
  const router = useRouter();
  const { showLoading, hideLoading } = useUIStore();
  const { width, height } = useWindowDimensions();

  const [checkingSession, setCheckingSession] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  const [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const readyForContinue = useMemo(
    () => introDone && fontsLoaded,
    [introDone, fontsLoaded],
  );

  // Button animation (fade + slight slide)
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnTranslateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!readyForContinue) return;

    // reset (in case you ever come back to this screen)
    btnOpacity.setValue(0);
    btnTranslateY.setValue(8);

    Animated.parallel([
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(btnTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [readyForContinue, btnOpacity, btnTranslateY]);

  const handlePress = async () => {
    setCheckingSession(true);
    showLoading("Checking your session...");

    const start = Date.now();
    while (!useAuthStore.getState().hydrated && Date.now() - start < 1200) {
      await new Promise((r) => setTimeout(r, 50));
    }

    const { session } = useAuthStore.getState();
    hideLoading();

    if (session) router.replace("/(tabs)");
    else router.replace("/(auth)/signup");
  };

  if (checkingSession) return <Loading />;

  const logoSize = Math.min(Math.max(width * 0.42, 600), 300);

  return (
    <ImageBackground
      source={require("../../assets/images/splash-background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.hero}>
            {/* Heart Logo */}
            <Image
              source={require("../../assets/images/splash-logo.png")}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />

            {/* Title */}
            <AppText weight="bold" style={styles.title}>
              G.R.A.C.E
            </AppText>

            {/* Subtitle */}
            <AppText style={styles.subtitle}>
              Guided Response & Care Environment
            </AppText>

            {/* Fixed button slot */}
            <View style={styles.buttonSlot}>
              {readyForContinue && (
                <Animated.View
                  style={{
                    opacity: btnOpacity,
                    transform: [{ translateY: btnTranslateY }],
                  }}
                >
                  <Pressable onPress={handlePress} style={styles.button}>
                    <AppText weight="semibold" style={styles.buttonText}>
                      Press to continue
                    </AppText>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const BUTTON_HEIGHT = 52;

const styles = StyleSheet.create({
  background: { flex: 1 },
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

  logo: {
    marginBottom: 18,
  },

  title: {
    fontSize: theme.typography.fontSize["3xl"],
    letterSpacing: theme.typography.letterSpacing.brand,
    color: theme.colors.text.primary,
  },

  subtitle: {
    marginTop: 10,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    color: theme.colors.text.primary,
    opacity: 0.85,
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
