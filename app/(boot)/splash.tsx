import Loading from "@/components/Loading";
import { useAuthStore } from "@/state/auth.store";
import { useUIStore } from "@/state/ui.store";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito-sans";

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

  // ---- Button animation (fade + slight slide up)
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!readyForContinue) return;

    Animated.parallel([
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(btnTranslateY, {
        toValue: 0,
        duration: 450,
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

  return (
    <ImageBackground
      source={require("../../assets/images/splash-background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content]}>
          {/* Logo */}
          <Image
            source={require("../../assets/images/splash-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* App Name */}
          <Text style={styles.title}>G.R.A.C.E</Text>

          {/* Tagline */}
          <Text style={styles.subtitle}>
            Guided Response & Care Environment
          </Text>

          {/* Push button down without absolute positioning */}
          <View style={{ height: 36 }} />

          {/* Continue Button */}
          {readyForContinue ? (
            <Animated.View
              style={{
                opacity: btnOpacity,
                transform: [{ translateY: btnTranslateY }],
              }}
            >
              <Pressable onPress={handlePress} style={styles.button}>
                <Text style={styles.buttonText}>Press to continue</Text>
              </Pressable>
            </Animated.View>
          ) : (
            // keeps layout stable while waiting
            <View style={{ height: 52 }} />
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  title: {
    marginTop: 18,
    fontSize: 42,
    letterSpacing: 8,
    fontFamily: "NunitoSans_700Bold",
    color: "#2F3A4A",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 18,
    textAlign: "center",
    fontFamily: "NunitoSans_400Regular",
    color: "#2F3A4A",
    opacity: 0.85,
  },

  button: {
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  logo: { position: "absolute", top: 0, width: 500, height: 500 },

  buttonText: {
    fontSize: 16,
    fontFamily: "NunitoSans_600SemiBold",
    color: "#1F2937",
  },
});
