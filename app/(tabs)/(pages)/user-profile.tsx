import Card from "@/components/layout/Card";
import Screen from "@/components/layout/Screen";
import Section from "@/components/layout/Section";
import AppText from "@/src/components/AppText";
import { useAuthStore } from "@/src/state/auth.store";
import { theme } from "@/src/theme";
import { router } from "expo-router";
import {
  CircleUserRound,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

export default function UserProfilePage() {
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  const user = session?.user;
  const fullName =
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    (typeof user?.user_metadata?.name === "string"
      ? user.user_metadata.name
      : null) ??
    "Account User";

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/post-login");
  };

  return (
    <Screen
      screenBackground={require("@/assets/images/clouds.png")}
      useSafeArea={false}
    >
      <Section>
        <Card padding="md" borderActive={true} elevationActive={true}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarWrap}>
              <CircleUserRound size={28} color={theme.colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" style={styles.profileTitle}>
                {fullName}
              </AppText>
              <View style={styles.metaRow}>
                <Mail size={14} color="rgba(31,45,61,0.7)" />
                <AppText style={styles.metaText}>
                  {user?.email ?? "No email found"}
                </AppText>
              </View>
            </View>
          </View>
        </Card>

        <Card padding="md" borderActive={true} elevationActive={true}>
          <AppText weight="semibold" style={styles.sectionTitle}>
            Account
          </AppText>

          <Pressable style={styles.rowItem}>
            <View style={styles.rowIconWrap}>
              <UserRound size={16} color={theme.colors.brand.dark} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="semibold" style={styles.rowTitle}>
                Personal details
              </AppText>
              <AppText style={styles.rowSubTitle}>
                Name, contact details, and profile settings.
              </AppText>
            </View>
          </Pressable>

          <Pressable style={styles.rowItem}>
            <View style={styles.rowIconWrap}>
              <ShieldCheck size={16} color={theme.colors.brand.dark} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="semibold" style={styles.rowTitle}>
                Security
              </AppText>
              <AppText style={styles.rowSubTitle}>
                Password, device access, and authentication.
              </AppText>
            </View>
          </Pressable>
        </Card>

        <Card padding="md" borderActive={true} elevationActive={true}>
          <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut size={16} color="#B83232" />
            <AppText weight="semibold" style={styles.signOutText}>
              Sign Out
            </AppText>
          </Pressable>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.14)",
  },
  profileTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: theme.typography.fontSize.md,
  },
  rowItem: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(255,255,255,0.88)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.13)",
  },
  rowTitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  rowSubTitle: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  signOutBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(184,50,50,0.24)",
    backgroundColor: "rgba(184,50,50,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutText: {
    color: "#B83232",
  },
});
