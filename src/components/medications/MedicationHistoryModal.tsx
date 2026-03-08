import { MedicationHistoryItem } from "@/src/api/medications/service";
import AppText from "@/src/components/AppText";
import { theme } from "@/src/theme";
import { ChevronDown } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  items: MedicationHistoryItem[];
  onChangeStatus: (
    item: MedicationHistoryItem,
    status: "taken" | "skipped" | "rejected",
  ) => Promise<void> | void;
  isSaving?: boolean;
  canEdit?: boolean;
};

const STATUS_OPTIONS: ("taken" | "skipped" | "rejected")[] = [
  "taken",
  "skipped",
  "rejected",
];

function format24HourWithMeridiem(d: Date) {
  const time24 = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const meridiem = d.toLocaleTimeString([], {
    hour: "numeric",
    hour12: true,
  });
  const suffix = meridiem.slice(-2).toUpperCase();
  return `${time24} ${suffix}`;
}

function formatHistoryDateTime(d: Date) {
  return `${d.toLocaleDateString([], { day: "2-digit", month: "short" })} • ${format24HourWithMeridiem(d)}`;
}

export default function MedicationHistoryModal({
  visible,
  onClose,
  items,
  onChangeStatus,
  isSaving = false,
  canEdit = true,
}: Props) {
  const [openItemId, setOpenItemId] = React.useState<string | null>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (!visible) setOpenItemId(null);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 16 + Math.max(insets.bottom, 8) }]}
          onPress={() => {}}
        >
          <View style={styles.headerRow}>
            <AppText weight="bold" style={styles.title}>
              Medication History
            </AppText>
            <AppText style={styles.subtitle}>Last 7 days • Assumed taken</AppText>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          >
            {items.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AppText style={styles.emptyText}>
                  No medication history available yet.
                </AppText>
              </View>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold" style={styles.rowTitle}>
                      {item.medicationName}
                    </AppText>
                    <AppText style={styles.rowMeta}>
                      {item.dose} • {formatHistoryDateTime(item.dueAt)}
                    </AppText>
                    {item.note ? (
                      <AppText style={styles.historyNote}>{item.note}</AppText>
                    ) : null}
                  </View>
                  <View style={styles.statusDropdownWrap}>
                    <Pressable
                      style={[
                        styles.statusDropdownTrigger,
                        item.status === "taken" && styles.historyStatusTaken,
                        item.status === "skipped" && styles.historyStatusSkipped,
                        item.status === "rejected" && styles.historyStatusRejected,
                      ]}
                      disabled={isSaving || !canEdit}
                      onPress={() =>
                        setOpenItemId((prev) => (prev === item.id ? null : item.id))
                      }
                    >
                      <AppText style={styles.historyStatusText}>{item.status}</AppText>
                      {canEdit ? (
                        <ChevronDown size={13} color={theme.colors.text.primary} />
                      ) : null}
                    </Pressable>
                    {openItemId === item.id && canEdit ? (
                      <View style={styles.statusMenu}>
                        {STATUS_OPTIONS.map((option) => {
                          const active = option === item.status;
                          return (
                            <Pressable
                              key={`${item.id}-${option}`}
                              style={[styles.statusMenuOption, active && styles.statusMenuOptionActive]}
                              disabled={isSaving}
                              onPress={async () => {
                                setOpenItemId(null);
                                if (active) return;
                                await onChangeStatus(item, option);
                              }}
                            >
                              <AppText
                                style={active ? styles.statusMenuOptionTextActive : styles.statusMenuOptionText}
                              >
                                {option}
                              </AppText>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <AppText weight="semibold" style={styles.closeText}>
              Close
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },
  headerRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  subtitle: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  list: {
    marginTop: 4,
    maxHeight: 460,
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    padding: 12,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  historyRow: {
    marginTop: 8,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(31,45,61,0.10)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyNote: {
    marginTop: 2,
    color: "#975A16",
    fontSize: theme.typography.fontSize.xs,
  },
  rowTitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  rowMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  statusDropdownWrap: {
    minWidth: 116,
    alignItems: "flex-end",
  },
  statusDropdownTrigger: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyStatusTaken: {
    backgroundColor: "rgba(47,133,90,0.18)",
  },
  historyStatusSkipped: {
    backgroundColor: "rgba(183,121,31,0.18)",
  },
  historyStatusRejected: {
    backgroundColor: "rgba(209,67,67,0.16)",
  },
  historyStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusMenu: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(255,255,255,0.98)",
    minWidth: 108,
    overflow: "hidden",
  },
  statusMenuOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statusMenuOptionActive: {
    backgroundColor: "rgba(74,144,226,0.12)",
  },
  statusMenuOptionText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    textTransform: "capitalize",
  },
  statusMenuOptionTextActive: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  closeBtn: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.22)",
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingVertical: 10,
    alignItems: "center",
  },
  closeText: {
    color: theme.colors.brand.dark,
  },
});
