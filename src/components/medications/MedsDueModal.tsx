import { theme } from "@/src/theme";
import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";

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
};

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MedsDueModal({ visible, onClose, items }: Props) {
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
          <AppText style={styles.subtitle}>
            Keep track of doses due soon and upcoming reminders.
          </AppText>

          <View style={styles.list}>
            {sorted.length === 0 ? (
              <View style={styles.empty}>
                <AppText style={styles.emptyText}>No medications due yet.</AppText>
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
                    <AppText weight="semibold" style={styles.medName}>
                      {item.name}
                    </AppText>
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
  subtitle: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
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
  medName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
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
