import Section from "@/components/layout/Section";
import AppText from "@/src/components/AppText";
import Screen from "@/src/components/layout/Screen";
import SwipeableTabScreen from "@/src/components/navigation/SwipeableTabScreen";
import { theme } from "@/src/theme";
import { useRouter } from "expo-router";
import {
  BellRing,
  ClipboardList,
  FileText,
  ShieldAlert,
  Stethoscope,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

const ITEMS = [
  {
    label: "Care Circle",
    subtitle: "Manage family, caregivers, and clinicians.",
    href: "/(tabs)/(pages)/care-circle",
    Icon: UserRoundCog,
  },
  {
    label: "Patient Profiles",
    subtitle: "Switch active patient and view access roles.",
    href: "/(tabs)/(pages)/patient-profiles",
    Icon: Stethoscope,
  },
  {
    label: "Medical Plans",
    subtitle: "View and manage care plans and treatment goals.",
    href: "/(tabs)/(pages)/medical-plans",
    Icon: ClipboardList,
  },
  {
    label: "Notes, Logs & Media",
    subtitle: "Track notes, uploads, and patient activity logs.",
    href: "/(tabs)/(pages)/notes-logs-media",
    Icon: FileText,
  },
  {
    label: "Allergies & Alerts",
    subtitle: "Review important allergy and alert information.",
    href: "/(tabs)/(pages)/allergies-alerts",
    Icon: BellRing,
  },
  {
    label: "Emergency",
    subtitle: "Open emergency contacts and urgent guidance.",
    href: "/(tabs)/(pages)/emergency",
    Icon: ShieldAlert,
  },
] as const;

export default function More() {
  const router = useRouter();

  const onRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  return (
    <SwipeableTabScreen activeRoute="/(tabs)/more">
      <Screen
        screenBackground={require("@/assets/images/clouds.png")}
        useSafeArea={true}
      >
        <Section onRefresh={onRefresh}>
          <View style={styles.sectionHeader}></View>
          {ITEMS.map((item) => (
            <MoreRow
              key={item.href}
              title={item.label}
              subtitle={item.subtitle}
              Icon={item.Icon}
              onPress={() => router.push(item.href)}
            />
          ))}
        </Section>
      </Screen>
    </SwipeableTabScreen>
  );
}

function MoreRow({
  title,
  subtitle,
  Icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIconWrap}>
        <Icon size={25} color={theme.colors.brand.dark} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="semibold" style={styles.rowTitle}>
          {title}
        </AppText>
        <AppText style={styles.rowSubtitle}>{subtitle}</AppText>
      </View>
      <AppText weight="bold" style={styles.rowChevron}>
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroCard: {
    backgroundColor: "rgba(234,243,251,0.85)",
    borderColor: "rgba(74,144,226,0.18)",
  },
  heroTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  heroSubtitle: {
    marginTop: 4,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
  },
  sectionHint: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  row: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(255,255,255,0.88)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    height: 80,
  },
  rowIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.13)",
  },
  rowTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  rowSubtitle: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  rowChevron: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xl,
    lineHeight: 20,
  },
});
