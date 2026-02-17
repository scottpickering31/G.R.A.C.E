import BackToHomeButton from "@/components/buttons/BackToHomeButton";
import Loading from "@/src/components/Loading";
import { theme } from "@/src/theme";
import { useAuthStore } from "@/state/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";

export default function TabsLayout() {
  const router = useRouter();
  // const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);

  console.log("TABS layout:", { hydrated, hasSession: !!session });

  if (!hydrated) return <Loading />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerLeft: () => <BackToHomeButton />,
        headerTransparent: true,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700" },

        tabBarStyle: {
          borderColor: "rgba(30, 58, 138, 0.2)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          height: "10%",
          paddingTop: 15,
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
        name="(pages)/profiles"
        options={{ href: null, title: "Profiles" }}
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
    </Tabs>
  );
}
