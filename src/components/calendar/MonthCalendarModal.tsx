import { cardStyles, colors } from "@/styles/shared-styles";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";

type Props = {
  visible: boolean;
  initialDate: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function formatMonthYear(d: Date) {
  const month = d.toLocaleString(undefined, { month: "long" });
  return `${month} ${d.getFullYear()}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function MonthCalendarModal({
  visible,
  initialDate,
  onSelect,
  onClose,
}: Props) {
  const [cursor, setCursor] = useState<Date>(startOfMonth(initialDate));
  const selected = initialDate;

  const grid = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);

    const startDay = start.getDay(); // 0..6
    const daysInMonth = end.getDate();

    // 6 rows * 7 cols
    const cells: { date: Date; inMonth: boolean }[] = [];

    // leading days (previous month)
    for (let i = 0; i < startDay; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (startDay - i));
      cells.push({ date: d, inMonth: false });
    }

    // this month
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        date: new Date(cursor.getFullYear(), cursor.getMonth(), day),
        inMonth: true,
      });
    }

    // trailing to complete grid
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, inMonth: false });
    }
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, inMonth: false });
    }

    return cells;
  }, [cursor]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, cardStyles.border]} onPress={() => {}}>
          <View style={styles.header}>
            <Pressable
              onPress={() => setCursor((d) => addMonths(d, -1))}
              style={styles.headerBtn}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.brand.primary}
              />
            </Pressable>

            <AppText style={styles.headerTitle}>
              {formatMonthYear(cursor)}
            </AppText>

            <Pressable
              onPress={() => setCursor((d) => addMonths(d, 1))}
              style={styles.headerBtn}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.brand.primary}
              />
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {DAY_NAMES.map((n) => (
              <AppText key={n} style={styles.weekHeaderText}>
                {n}
              </AppText>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map(({ date, inMonth }) => {
              const active = isSameDay(date, selected);
              return (
                <Pressable
                  key={date.toISOString()}
                  onPress={() => onSelect(date)}
                  style={[styles.cell, active && styles.cellActive]}
                >
                  <AppText
                    style={[
                      styles.cellText,
                      !inMonth && styles.cellTextMuted,
                      active && styles.cellTextActive,
                    ]}
                  >
                    {date.getDate()}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <AppText style={styles.closeText}>Close</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.10)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text.primary,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekHeaderText: {
    width: 42,
    textAlign: "center",
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cell: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cellActive: {
    backgroundColor: colors.brand.primary,
  },
  cellText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "600",
  },
  cellTextMuted: {
    color: "rgba(31,41,55,0.30)",
  },
  cellTextActive: {
    color: "#fff",
  },
  closeBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "rgba(74,144,226,0.10)",
  },
  closeText: {
    fontWeight: "800",
    color: colors.brand.primary,
  },
});
