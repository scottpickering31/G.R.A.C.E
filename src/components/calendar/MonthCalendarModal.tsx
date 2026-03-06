import { cardStyles, colors } from "@/styles/shared-styles";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";

type Props = {
  visible: boolean;
  initialDate: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
  markedDateKeys?: ReadonlySet<string>;
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
function toDateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const LARGE_JUMP_MONTHS_CALENDAR_MODE = 12; // 1 year
const LARGE_JUMP_MONTHS_YEAR_MODE = 120; // 10 years
const YEAR_GRID_SIZE = 12;

export default function MonthCalendarModal({
  visible,
  initialDate,
  onSelect,
  onClose,
  markedDateKeys,
}: Props) {
  const [cursor, setCursor] = useState<Date>(startOfMonth(initialDate));
  const [showYearPicker, setShowYearPicker] = useState(false);
  const selected = initialDate;

  useEffect(() => {
    if (!visible) return;
    setCursor(startOfMonth(initialDate));
    setShowYearPicker(false);
  }, [visible, initialDate]);

  const yearStart = useMemo(() => {
    const y = cursor.getFullYear();
    return y - (y % YEAR_GRID_SIZE);
  }, [cursor]);

  const yearGrid = useMemo(
    () => Array.from({ length: YEAR_GRID_SIZE }, (_, i) => yearStart + i),
    [yearStart],
  );

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
              onPress={() =>
                setCursor((d) =>
                  addMonths(
                    d,
                    showYearPicker
                      ? -LARGE_JUMP_MONTHS_YEAR_MODE
                      : -LARGE_JUMP_MONTHS_CALENDAR_MODE,
                  ),
                )
              }
              style={styles.headerBtn}
            >
              <Ionicons
                name="play-back"
                size={20}
                color={colors.brand.primary}
              />
            </Pressable>

            <Pressable
              onPress={() =>
                setCursor((d) =>
                  addMonths(d, showYearPicker ? -YEAR_GRID_SIZE : -1),
                )
              }
              style={styles.headerBtn}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.brand.primary}
              />
            </Pressable>

            <Pressable
              onPress={() => setShowYearPicker((v) => !v)}
              style={styles.headerTitleBtn}
            >
              <AppText style={styles.headerTitle}>
                {formatMonthYear(cursor)}
              </AppText>
            </Pressable>

            <Pressable
              onPress={() =>
                setCursor((d) =>
                  addMonths(d, showYearPicker ? YEAR_GRID_SIZE : 1),
                )
              }
              style={styles.headerBtn}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.brand.primary}
              />
            </Pressable>

            <Pressable
              onPress={() =>
                setCursor((d) =>
                  addMonths(
                    d,
                    showYearPicker
                      ? LARGE_JUMP_MONTHS_YEAR_MODE
                      : LARGE_JUMP_MONTHS_CALENDAR_MODE,
                  ),
                )
              }
              style={styles.headerBtn}
            >
              <Ionicons
                name="play-forward"
                size={20}
                color={colors.brand.primary}
              />
            </Pressable>
          </View>

          {showYearPicker ? (
            <View style={styles.yearGrid}>
              {yearGrid.map((year) => {
                const active = year === selected.getFullYear();
                return (
                  <Pressable
                    key={year}
                    onPress={() => {
                      setCursor((d) => new Date(year, d.getMonth(), 1));
                      setShowYearPicker(false);
                    }}
                    style={[styles.yearCell, active && styles.yearCellActive]}
                  >
                    <AppText
                      style={[styles.yearText, active && styles.yearTextActive]}
                    >
                      {year}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <>
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
                  const hasEvent = markedDateKeys?.has(toDateKey(date)) ?? false;
                  return (
                    <Pressable
                      key={date.toISOString()}
                      onPress={() => onSelect(date)}
                      style={[styles.cell, active && styles.cellActive]}
                    >
                      <View style={styles.cellContent}>
                        <AppText
                          style={[
                            styles.cellText,
                            !inMonth && styles.cellTextMuted,
                            active && styles.cellTextActive,
                          ]}
                        >
                          {date.getDate()}
                        </AppText>
                        {inMonth && hasEvent ? (
                          <View
                            style={[
                              styles.eventDot,
                              active && styles.eventDotActive,
                            ]}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

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
  headerTitleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(74,144,226,0.08)",
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
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  yearCell: {
    width: "31%",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.08)",
  },
  yearCellActive: {
    backgroundColor: colors.brand.primary,
  },
  yearText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "700",
  },
  yearTextActive: {
    color: "#fff",
  },
  cell: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cellContent: {
    alignItems: "center",
    justifyContent: "center",
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
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    marginTop: 2,
    backgroundColor: colors.brand.primary,
  },
  eventDotActive: {
    backgroundColor: "#fff",
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
