import { cardStyles, colors } from "@/styles/shared-styles";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import MonthCalendarModal from "./MonthCalendarModal";

type Props = {
  value?: Date;
  onChange?: (date: Date) => void;
  style?: ViewStyle;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
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

export default function CollapsibleCalendar({ value, onChange, style }: Props) {
  const [selected, setSelected] = useState<Date>(value ?? new Date());
  const [modalOpen, setModalOpen] = useState(false);

  const weekStart = useMemo(() => startOfWeek(selected), [selected]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const monthAnchor = selected; // month label uses selected date

  const setDate = (d: Date) => {
    setSelected(d);
    onChange?.(d);
  };

  return (
    <>
      <Pressable
        onPress={() => setModalOpen(true)}
        style={[styles.card, cardStyles.border, style]}
      >
        {/* Top row: month/year + chevrons */}
        <View style={styles.topRow}>
          <View style={styles.monthRow}>
            <Ionicons
              name="chevron-back"
              size={18}
              color={colors.brand.primary}
            />
            <Text style={styles.monthText}>{formatMonthYear(monthAnchor)}</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.brand.primary}
            />
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="rgba(31,41,55,0.45)"
          />
        </View>

        {/* Week header */}
        <View style={styles.weekHeader}>
          {DAY_NAMES.map((n) => (
            <Text key={n} style={styles.weekHeaderText}>
              {n}
            </Text>
          ))}
        </View>

        {/* Week dates */}
        <View style={styles.weekRow}>
          {weekDays.map((d) => {
            const active = isSameDay(d, selected);
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => setDate(d)}
                style={styles.dayCell}
              >
                {active ? (
                  <View style={styles.activePillWrap}>
                    <View style={styles.activePill}>
                      <Text style={styles.activeDayText}>{d.getDate()}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.dayText}>{d.getDate()}</Text>
                )}

                {/* optional dot indicator (example) */}
                <View style={[styles.dot, { opacity: 1 }]} />
              </Pressable>
            );
          })}
        </View>
      </Pressable>

      <MonthCalendarModal
        visible={modalOpen}
        initialDate={selected}
        onClose={() => setModalOpen(false)}
        onSelect={(d) => {
          setDate(d);
          setModalOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.90)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
  },

  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  weekHeaderText: {
    width: 38,
    textAlign: "center",
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: "500",
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dayCell: {
    width: 38,
    alignItems: "center",
  },
  dayText: {
    fontSize: 20,
    color: colors.text.primary,
    fontWeight: "500",
    paddingVertical: 6,
  },

  activePillWrap: {
    alignItems: "center",
  },
  activePill: {
    width: 52,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(74, 144, 226, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  activeDayText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "800",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 6,
    backgroundColor: colors.brand.primary,
  },
});
