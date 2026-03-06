import { theme } from "@/src/theme";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";

export type MedsDueWindowHours = 1 | 24 | 168;

export type UpcomingMedication = {
  id: string;
  name: string;
  dose: string;
  dueAt: Date;
  note?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  items: UpcomingMedication[];
  windowHours: MedsDueWindowHours;
  onChangeWindowHours: (hours: MedsDueWindowHours) => void;
};

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateTime(d: Date) {
  return d.toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MedsDueModal({
  visible,
  onClose,
  items,
  windowHours,
  onChangeWindowHours,
}: Props) {
  const [now, setNow] = useState(new Date());
  const [showWindowOptions, setShowWindowOptions] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setNow(new Date());
    setShowWindowOptions(false);
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => clearInterval(timer);
  }, [visible]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime()),
    [items],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <AppText weight="bold" style={styles.title}>
            Upcoming Medications
          </AppText>
          {showWindowOptions ? (
            <View style={styles.windowOptions}>
              {([
                [1, "Next hour"],
                [24, "Next 24 hours"],
                [168, "Next 7 days"],
              ] as [MedsDueWindowHours, string][]).map(([hours, label]) => {
                const active = windowHours === hours;
                return (
                  <Pressable
                    key={hours}
                    style={[styles.windowOption, active && styles.windowOptionActive]}
                    onPress={() => {
                      onChangeWindowHours(hours);
                      setShowWindowOptions(false);
                    }}
                  >
                    <AppText style={[styles.windowOptionText, active && styles.windowOptionTextActive]}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <AppText style={styles.nowText}>
            Current: {formatDateTime(now)}
          </AppText>
          <Pressable
            style={styles.windowPickerRow}
            onPress={() => setShowWindowOptions((v) => !v)}
          >
            <AppText weight="semibold" style={styles.windowPickerTitle}>
              Time Window
            </AppText>
            <AppText style={styles.windowPickerValue}>
              {windowHours === 1 ? "Next hour" : windowHours === 24 ? "Next 24 hours" : "Next 7 days"}
            </AppText>
          </Pressable>

          <View style={styles.list}>
            {sorted.length === 0 ? (
              <View style={styles.empty}>
                <AppText style={styles.emptyText}>
                  No medications due in this window.
                </AppText>
              </View>
            ) : (
              sorted.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View style={styles.timePill}>
                    <AppText weight="semibold" style={styles.timeText}>
                      {formatTime(item.dueAt)}
                    </AppText>
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.rowHeader}>
                      <AppText weight="semibold" style={styles.medName}>
                        {item.name}
                      </AppText>
                      <AppText style={styles.dueDateText}>{formatDate(item.dueAt)}</AppText>
                    </View>
                    <AppText style={styles.medDose}>{item.dose}</AppText>
                    {item.note ? <AppText style={styles.medNote}>{item.note}</AppText> : null}
                  </View>
                </View>
              ))
            )}
          </View>

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
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  windowOptions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  windowOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  windowOptionActive: {
    borderColor: "rgba(74,144,226,0.24)",
    backgroundColor: "rgba(74,144,226,0.12)",
  },
  windowOptionText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  windowOptionTextActive: {
    color: theme.colors.brand.dark,
  },
  nowText: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  windowPickerRow: {
    marginTop: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(234,243,251,0.7)",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  windowPickerTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  windowPickerValue: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.sm,
  },
  list: {
    marginTop: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    padding: 10,
    backgroundColor: "rgba(234,243,251,0.6)",
  },
  timePill: {
    minWidth: 74,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.16)",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.25)",
    alignSelf: "center",
  },
  timeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.brand.dark,
  },
  rowBody: {
    flex: 1,
    gap: 1,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  medName: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  dueDateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  medDose: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  medNote: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  empty: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(234,243,251,0.6)",
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.text.secondary,
  },
  closeBtn: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "rgba(74,144,226,0.12)",
    paddingVertical: 12,
    alignItems: "center",
  },
  closeText: {
    color: theme.colors.brand.dark,
  },
});
