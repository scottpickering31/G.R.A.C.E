import BackToHomeButton from "@/components/buttons/BackToHomeButton";
import { useOwnerPendingAccessRequests } from "@/src/api/access/hooks";
import Loading from "@/src/components/Loading";
import { theme } from "@/src/theme";
import { useAuthStore } from "@/state/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const userId = session?.user.id;
  const { data: ownerPendingRequests } = useOwnerPendingAccessRequests(userId);
  const pendingCount = ownerPendingRequests?.length ?? 0;

  if (!hydrated) return <Loading />;
  if (!session) return <Redirect href="/(auth)/post-login" />;

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: true,
        headerLeft: () => <BackToHomeButton />,
        headerRight: () =>
          pathname === "/(tabs)/(pages)/user-profile" ? null : (
            <View style={styles.headerActionsRow}>
              <Pressable
                onPress={() => router.push("/(tabs)/(pages)/notifications")}
                style={styles.iconButton}
              >
                <Ionicons name="notifications-outline" size={22} color="#1F2937" />
                {pendingCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => router.push("/(tabs)/(pages)/user-profile")}
                style={styles.iconButton}
              >
                <Ionicons name="settings-outline" size={24} color="#1F2937" />
              </Pressable>
            </View>
          ),
        headerTransparent: true,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700" },

        tabBarStyle: {
          borderColor: "rgba(30, 58, 138, 0.2)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          height: 64 + Math.max(insets.bottom, 8),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: 0,
          // shadow (iOS)
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },

          // shadow (Android)
          elevation: 10,
        },

        // ✅ label/icon styling
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarInactiveTintColor: "#9AA7B6",
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: "600",
          textAlign: "center",
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarIconStyle: {
          alignSelf: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="medications-treatments"
        options={{
          title: "Medications",
          headerTitle: "Medications & Treatments",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "medkit" : "medkit-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="stock"
        options={{
          title: "Stock",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "cube" : "cube-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Future Development: */}

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                focused ? "ellipsis-horizontal" : "ellipsis-horizontal-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/more");
          },
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen
        name="(pages)/patient-profiles"
        options={{ href: null, title: "Patient Profiles" }}
      />
      <Tabs.Screen
        name="(pages)/notifications"
        options={{ href: null, title: "Notifications" }}
      />
      <Tabs.Screen
        name="(pages)/patient-profile/[patientId]"
        options={{ href: null, title: "Patient Profile" }}
      />
      <Tabs.Screen
        name="(pages)/medical-plans"
        options={{ href: null, title: "Medical Plans" }}
      />
      <Tabs.Screen
        name="(pages)/notes-logs-media"
        options={{ href: null, title: "Notes, Logs & Media" }}
      />
      <Tabs.Screen
        name="(pages)/care-circle"
        options={{ href: null, title: "Care Circle" }}
      />
      <Tabs.Screen
        name="(pages)/emergency"
        options={{ href: null, title: "Emergency" }}
      />
      <Tabs.Screen
        name="(pages)/allergies-alerts"
        options={{ href: null, title: "Allergies & Alerts" }}
      />
      <Tabs.Screen
        name="(pages)/user-profile"
        options={{ href: null, title: "My Profile" }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  badge: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "#D14343",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "white",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    lineHeight: 12,
  },
});
