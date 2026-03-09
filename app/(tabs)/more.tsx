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
    comingSoon: false,
  },
  {
    label: "Patient Profiles",
    subtitle: "Switch active patient and view access roles.",
    href: "/(tabs)/(pages)/patient-profiles",
    Icon: Stethoscope,
    comingSoon: false,
  },
  {
    label: "Medical Plans",
    subtitle: "View and manage care plans and treatment goals.",
    href: "/(tabs)/(pages)/medical-plans",
    Icon: ClipboardList,
    comingSoon: true,
  },
  {
    label: "Notes, Logs & Media",
    subtitle: "Track notes, uploads, and patient activity logs.",
    href: "/(tabs)/(pages)/notes-logs-media",
    Icon: FileText,
    comingSoon: true,
  },
  {
    label: "Allergies & Alerts",
    subtitle: "Review important allergy and alert information.",
    href: "/(tabs)/(pages)/allergies-alerts",
    Icon: BellRing,
    comingSoon: true,
  },
  {
    label: "Emergency",
    subtitle: "Open emergency contacts and urgent guidance.",
    href: "/(tabs)/(pages)/emergency",
    Icon: ShieldAlert,
    comingSoon: true,
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
              comingSoon={!!item.comingSoon}
              onPress={() => {
                if (item.comingSoon) return;
                router.push(item.href);
              }}
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
  comingSoon = false,
}: {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  onPress: () => void;
  comingSoon?: boolean;
}) {
  return (
    <Pressable
      style={[styles.row, comingSoon && styles.rowDisabled]}
      onPress={onPress}
      disabled={comingSoon}
    >
      <View
        style={[styles.rowIconWrap, comingSoon && styles.rowIconWrapDisabled]}
      >
        <Icon
          size={25}
          color={comingSoon ? theme.colors.text.muted : theme.colors.brand.dark}
        />
      </View>
      <View style={{ flex: 1 }}>
        <AppText
          weight="semibold"
          style={[styles.rowTitle, comingSoon && styles.rowTitleDisabled]}
        >
          {title}
        </AppText>
      </View>
      {comingSoon ? (
        <View style={styles.comingSoonPill}>
          <AppText weight="bold" style={styles.comingSoonPillText}>
            Soon
          </AppText>
        </View>
      ) : (
        <AppText weight="bold" style={styles.rowChevron}>
          ›
        </AppText>
      )}
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
  rowDisabled: {
    backgroundColor: "rgba(240,244,248,0.9)",
    borderColor: "rgba(154,167,182,0.26)",
  },
  rowIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.13)",
  },
  rowIconWrapDisabled: {
    backgroundColor: "rgba(154,167,182,0.18)",
  },
  rowTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  rowTitleDisabled: {
    color: theme.colors.text.secondary,
  },
  rowSubtitle: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  rowSubtitleDisabled: {
    color: theme.colors.text.muted,
  },
  rowChevron: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xl,
    lineHeight: 20,
  },
  comingSoonPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(154,167,182,0.34)",
    backgroundColor: "rgba(154,167,182,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  comingSoonPillText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
});
