import Card from "@/components/layout/Card";
import Screen from "@/components/layout/Screen";
import Section from "@/components/layout/Section";
import ProfileHeader from "@/components/profile/ProfileHeader";
import {
  useAppointments,
  useSetAppointmentCompleted,
  useUpsertAppointment,
} from "@/src/api/appointments/hooks";
import {
  useActivePatientMembership,
  usePrimaryPatientId,
} from "@/src/api/medications/hooks";
import AppText from "@/src/components/AppText";
import CollapsibleCalendar from "@/src/components/calendar/CollapsibleCalendar";
import MonthCalendarModal from "@/src/components/calendar/MonthCalendarModal";
import SwipeableTabScreen from "@/src/components/navigation/SwipeableTabScreen";
import { useAuthStore } from "@/src/state/auth.store";
import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import { useFocusEffect } from "@react-navigation/native";
import {
  CalendarDays,
  CheckCircle2,
  CirclePlus,
  Clock3,
  ListChecks,
  Stethoscope,
  TriangleAlert,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

type AppointmentFilter = "all" | "upcoming" | "missed" | "completed";
type AgendaMode = "daily" | "weekly";
const HOURS_24 = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

type AppointmentItem = {
  id: string;
  title: string;
  startsAt: string;
  type: string;
  location: string;
  clinician: string;
  notes: string;
  completed: boolean;
};

type AppointmentForm = {
  title: string;
  date: string;
  time: string;
  type: string;
  location: string;
  clinician: string;
  notes: string;
};

const FILTERS: { key: AppointmentFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "missed", label: "Missed" },
  { key: "completed", label: "Completed" },
];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function normalizeLocalDate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

function formatClock(d: Date) {
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

function formatTime12Hour(hour24: string, minute: string) {
  const hourNum = Number(hour24);
  const suffix = hourNum >= 12 ? "PM" : "AM";
  const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${hour12}:${minute} ${suffix}`;
}

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfWeek(d: Date) {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatAgendaDate(d: Date) {
  return d.toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function statusForAppointment(item: AppointmentItem, now: Date) {
  if (item.completed) return "completed" as const;
  const startsAt = new Date(item.startsAt);
  return startsAt < now ? ("missed" as const) : ("upcoming" as const);
}

function asForm(item: AppointmentItem): AppointmentForm {
  const date = new Date(item.startsAt);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return {
    title: item.title,
    date: formatDateKey(date),
    time: `${hh}:${mm}`,
    type: item.type,
    location: item.location,
    clinician: item.clinician,
    notes: item.notes,
  };
}

function emptyForm(dateKey: string): AppointmentForm {
  return {
    title: "",
    date: dateKey,
    time: "09:00",
    type: "",
    location: "",
    clinician: "",
    notes: "",
  };
}

export default function Appointments() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { showToast } = useUIStore();
  const { data: activeMembership } = useActivePatientMembership(userId);
  const { data: primaryPatientId, refetch: refetchPrimaryPatient } =
    usePrimaryPatientId(userId);
  const {
    data: appointmentsData,
    refetch: refetchAppointments,
  } = useAppointments(primaryPatientId ?? undefined);
  const upsertAppointment = useUpsertAppointment(primaryPatientId ?? undefined);
  const setAppointmentCompleted = useSetAppointmentCompleted(
    primaryPatientId ?? undefined,
  );
  const [date, setDate] = useState(normalizeLocalDate(new Date()));
  const [agendaMode, setAgendaMode] = useState<AgendaMode>("daily");
  const [filter, setFilter] = useState<AppointmentFilter>("all");
  const [showEditor, setShowEditor] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AppointmentForm>(emptyForm(formatDateKey(new Date())));
  const [pickerHour, setPickerHour] = useState("09");
  const [pickerMinute, setPickerMinute] = useState("00");
  const appointments = useMemo(
    () => appointmentsData ?? [],
    [appointmentsData],
  );
  const isReadOnly = activeMembership?.role === "read_only";

  useEffect(() => {
    if (!isReadOnly) return;
    if (showEditor) {
      setShowEditor(false);
      setShowTimePicker(false);
      setShowDatePicker(false);
      setEditingId(null);
      showToast("Read-only access: unable to add or edit appointments.", "info");
    }
  }, [isReadOnly, showEditor, showToast]);

  const nowTs = Date.now();
  const selectedDateKey = formatDateKey(date);

  useFocusEffect(
    useCallback(() => {
      setDate(normalizeLocalDate(new Date()));
    }, []),
  );

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter(
          (item) => formatDateKey(new Date(item.startsAt)) === selectedDateKey,
        )
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
    [appointments, selectedDateKey],
  );
  const weekAppointments = useMemo(() => {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);

    return appointments
      .filter((item) => {
        const startsAt = new Date(item.startsAt);
        return startsAt >= weekStart && startsAt <= weekEnd;
      })
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [appointments, date]);
  const scopedAppointments =
    agendaMode === "weekly" ? weekAppointments : dayAppointments;

  const visibleAppointments = useMemo(
    () =>
      scopedAppointments.filter((item) => {
        if (filter === "all") return true;
        return statusForAppointment(item, new Date(nowTs)) === filter;
      }),
    [scopedAppointments, filter, nowTs],
  );

  const next24hCount = useMemo(() => {
    const in24h = nowTs + 24 * 60 * 60 * 1000;
    return appointments.filter((item) => {
      if (item.completed) return false;
      const t = new Date(item.startsAt).getTime();
      return t >= nowTs && t <= in24h;
    }).length;
  }, [appointments, nowTs]);
  const appointmentDateKeys = useMemo(
    () =>
      new Set(
        appointments.map((item) => formatDateKey(new Date(item.startsAt))),
      ),
    [appointments],
  );

  const missedCount = scopedAppointments.filter(
    (item) => statusForAppointment(item, new Date(nowTs)) === "missed",
  ).length;
  const completedCount = scopedAppointments.filter(
    (item) => item.completed,
  ).length;

  const openCreate = () => {
    if (isReadOnly) {
      showToast("Read-only access: cannot add appointments.", "info");
      return;
    }
    setEditingId(null);
    setForm(emptyForm(selectedDateKey));
    setPickerHour("09");
    setPickerMinute("00");
    setShowEditor(true);
  };

  const openEdit = (item: AppointmentItem) => {
    if (isReadOnly) {
      showToast("Read-only access: appointment editing is disabled.", "info");
      return;
    }
    setEditingId(item.id);
    const editForm = asForm(item);
    const [hour = "09", minute = "00"] = editForm.time.split(":");
    setForm(editForm);
    setPickerHour(hour);
    setPickerMinute(minute);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setShowTimePicker(false);
    setShowDatePicker(false);
    setEditingId(null);
    setForm(emptyForm(selectedDateKey));
    setPickerHour("09");
    setPickerMinute("00");
  };

  const saveAppointment = async () => {
    if (isReadOnly) {
      showToast("Read-only access: cannot save appointments.", "info");
      return;
    }
    if (!primaryPatientId || !userId) return;
    if (!form.title.trim()) return;

    const [hourRaw = "09", minuteRaw = "00"] = form.time.split(":");
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return;

    const selectedFormDate = parseDateKey(form.date);
    if (!selectedFormDate) return;

    const startsAt = new Date(
      selectedFormDate.getFullYear(),
      selectedFormDate.getMonth(),
      selectedFormDate.getDate(),
      hour,
      minute,
      0,
      0,
    ).toISOString();

    try {
      await upsertAppointment.mutateAsync({
        id: editingId ?? undefined,
        patientId: primaryPatientId,
        userId,
        title: form.title.trim(),
        startsAt,
        type: form.type.trim() || "General",
        location: form.location.trim() || "Not set",
        clinician: form.clinician.trim() || "Not set",
        notes: form.notes.trim(),
      });
      closeEditor();
    } catch (e: any) {
      showToast(e?.message ?? "Could not save appointment.", "error");
    }
  };

  const toggleCompleted = async (id: string, completed: boolean) => {
    if (isReadOnly) {
      showToast("Read-only access: cannot change appointment status.", "info");
      return;
    }
    try {
      await setAppointmentCompleted.mutateAsync({
        appointmentId: id,
        completed,
      });
    } catch (e: any) {
      showToast(e?.message ?? "Could not update appointment status.", "error");
    }
  };

  return (
    <SwipeableTabScreen activeRoute="/(tabs)/appointments">
      <Screen
        screenBackground={require("@/assets/images/clouds.png")}
        useSafeArea={false}
      >
        <Section
          onRefresh={async () => {
            await refetchPrimaryPatient();
            await refetchAppointments();
          }}
        >
          <View style={styles.headerContainer}>
            <ProfileHeader />
          </View>

          <Card
            padding="md"
            borderActive={true}
            elevationActive={true}
            style={styles.heroCard}
          >
            <AppText weight="bold" style={styles.heroTitle}>
              Appointment Planner
            </AppText>
            <AppText style={styles.heroSubtitle}>
              Track appointments and events across daily and weekly views.
            </AppText>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaChip}>
                <ListChecks size={14} color={theme.colors.brand.dark} />
                <AppText style={styles.heroMetaText}>
                  {agendaMode === "weekly" ? "Weekly mode" : "Daily mode"}
                </AppText>
              </View>
              <View style={styles.heroMetaChip}>
                <CalendarDays size={14} color={theme.colors.brand.dark} />
                <AppText style={styles.heroMetaText}>{selectedDateKey}</AppText>
              </View>
            </View>
          </Card>

          <View style={styles.metricsRow}>
            <Card
              padding="md"
              borderActive={true}
              elevationActive={true}
              style={styles.metricCard}
            >
              <Clock3 size={16} color="#1F2937" />
              <AppText weight="bold" style={styles.metricValue}>
                {next24hCount}
              </AppText>
              <AppText style={styles.metricLabel}>Next 24h</AppText>
            </Card>
            <Card
              padding="md"
              borderActive={true}
              elevationActive={true}
              style={styles.metricCard}
            >
              <TriangleAlert size={16} color="#D14343" />
              <AppText weight="bold" style={styles.metricValue}>
                {missedCount}
              </AppText>
              <AppText style={styles.metricLabel}>Missed</AppText>
            </Card>
            <Card
              padding="md"
              borderActive={true}
              elevationActive={true}
              style={styles.metricCard}
            >
              <CheckCircle2 size={16} color="#2F855A" />
              <AppText weight="bold" style={styles.metricValue}>
                {completedCount}
              </AppText>
              <AppText style={styles.metricLabel}>Completed</AppText>
            </Card>
          </View>

          <Card padding="none" borderActive={true} elevationActive={true}>
            <CollapsibleCalendar
              value={date}
              onChange={(d) => setDate(normalizeLocalDate(d))}
              markedDateKeys={appointmentDateKeys}
            />
          </Card>
          <Pressable style={styles.addAppointmentCta} onPress={openCreate}>
            <View style={styles.addAppointmentIconWrap}>
              <CirclePlus size={18} color={theme.colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="semibold" style={styles.addAppointmentTitle}>
                Add New Appointment
              </AppText>
              <AppText style={styles.addAppointmentSubtitle}>
                Create an appointment or event.
              </AppText>
            </View>
          </Pressable>

          <Card padding="md" borderActive={true} elevationActive={true}>
            <View style={styles.sectionTitleRow}>
              <AppText style={styles.sectionTitle}>
                {agendaMode === "weekly"
                  ? `Weekly Agenda (${formatDateKey(startOfWeek(date))} to ${formatDateKey(endOfWeek(date))})`
                  : `Daily Agenda (${selectedDateKey})`}
              </AppText>
            </View>

            <View style={styles.modeWrap}>
              <Pressable
                style={[
                  styles.modeChip,
                  agendaMode === "daily" && styles.modeChipActive,
                ]}
                onPress={() => setAgendaMode("daily")}
              >
                <AppText
                  style={[
                    styles.modeChipText,
                    agendaMode === "daily" && styles.modeChipTextActive,
                  ]}
                >
                  Daily
                </AppText>
              </Pressable>
              <Pressable
                style={[
                  styles.modeChip,
                  agendaMode === "weekly" && styles.modeChipActive,
                ]}
                onPress={() => setAgendaMode("weekly")}
              >
                <AppText
                  style={[
                    styles.modeChipText,
                    agendaMode === "weekly" && styles.modeChipTextActive,
                  ]}
                >
                  Weekly
                </AppText>
              </Pressable>
            </View>

            <View style={styles.filtersWrap}>
              {FILTERS.map((item) => {
                const active = filter === item.key;
                return (
                  <Pressable
                    key={item.key}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                    onPress={() => setFilter(item.key)}
                  >
                    <AppText
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {visibleAppointments.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AppText style={styles.emptyText}>
                  {agendaMode === "weekly"
                    ? "No appointments for this filter in the selected week."
                    : "No appointments for this filter on the selected date."}
                </AppText>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {visibleAppointments.map((item) => {
                  const startsAt = new Date(item.startsAt);
                  const status = statusForAppointment(item, new Date(nowTs));

                  return (
                    <Pressable
                      key={item.id}
                      style={styles.itemRow}
                      onPress={() => openEdit(item)}
                    >
                      <View style={styles.itemTopRow}>
                        <AppText weight="semibold" style={styles.itemTitle}>
                          {item.title}
                        </AppText>
                        <AppText style={styles.itemTime}>
                          {formatClock(startsAt)}
                        </AppText>
                      </View>

                      <View style={styles.itemMetaRow}>
                        <Stethoscope size={14} color="#4A90E2" />
                        <AppText style={styles.itemMetaText}>
                          {item.type} • {item.clinician}
                          {agendaMode === "weekly"
                            ? ` • ${formatAgendaDate(startsAt)}`
                            : ""}
                        </AppText>
                      </View>

                      <AppText style={styles.itemMetaText}>
                        {item.location}
                      </AppText>

                      {item.notes ? (
                        <AppText style={styles.itemNote}>{item.notes}</AppText>
                      ) : null}

                      <View style={styles.rowActions}>
                        <View
                          style={[
                            styles.statusBadge,
                            status === "upcoming" && styles.statusUpcoming,
                            status === "missed" && styles.statusMissed,
                            status === "completed" && styles.statusCompleted,
                          ]}
                        >
                          <AppText style={styles.statusBadgeText}>
                            {status}
                          </AppText>
                        </View>

                        <Pressable
                          style={styles.completeBtn}
                          disabled={isReadOnly}
                          onPress={() => toggleCompleted(item.id, !item.completed)}
                        >
                          <AppText style={styles.completeBtnText}>
                            {item.completed
                              ? "Mark as Upcoming"
                              : "Mark Completed"}
                          </AppText>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>
        </Section>

        <Modal
          transparent
          animationType="slide"
          visible={showEditor && !isReadOnly}
          onRequestClose={closeEditor}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeEditor}>
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <AppText weight="bold" style={styles.modalTitle}>
                {editingId ? "Edit Appointment" : "Add New Appointment"}
              </AppText>

              <TextInput
                value={form.title}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, title: value }))
                }
                placeholder="Title"
                style={styles.input}
              />

              <View style={styles.inputRow}>
                <Pressable
                  style={[styles.timePickerTrigger, styles.inputHalf]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.datePickerRow}>
                    <CalendarDays size={16} color="rgba(31,45,61,0.65)" />
                    <AppText style={styles.timePickerTriggerText}>
                      {form.date}
                    </AppText>
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.timePickerTrigger, styles.inputHalf]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <AppText style={styles.timePickerTriggerText}>
                    {formatTime12Hour(pickerHour, pickerMinute)}
                  </AppText>
                </Pressable>
                <TextInput
                  value={form.type}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, type: value }))
                  }
                  placeholder="Type"
                  style={[styles.input, styles.inputHalf]}
                />
              </View>

              <TextInput
                value={form.location}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, location: value }))
                }
                placeholder="Location"
                style={styles.input}
              />

              <TextInput
                value={form.clinician}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, clinician: value }))
                }
                placeholder="Clinician"
                style={styles.input}
              />

              <TextInput
                value={form.notes}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, notes: value }))
                }
                placeholder="Notes"
                style={[styles.input, styles.inputArea]}
                multiline
              />

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelBtn} onPress={closeEditor}>
                  <AppText style={styles.cancelBtnText}>Cancel</AppText>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={saveAppointment}>
                  <AppText style={styles.saveBtnText}>Save</AppText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setShowTimePicker(false)}
          >
            <Pressable style={styles.pickerSheet} onPress={() => {}}>
              <View style={styles.pickerTitleRow}>
                <AppText weight="bold" style={styles.pickerTitle}>
                  Select Appointment Time
                </AppText>
                <AppText weight="semibold" style={styles.pickerSelectedTime}>
                  {formatTime12Hour(pickerHour, pickerMinute)}
                </AppText>
              </View>

              <View style={styles.pickerCols}>
                <View style={styles.pickerCol}>
                  <AppText style={styles.pickerLabel}>Hour</AppText>
                  <ScrollView
                    style={styles.pickerScroll}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {HOURS_24.map((hour) => {
                      const active = hour === pickerHour;
                      return (
                        <Pressable
                          key={hour}
                          style={[
                            styles.pickerRow,
                            active && styles.pickerRowActive,
                          ]}
                          onPress={() => setPickerHour(hour)}
                        >
                          <AppText
                            style={[
                              styles.pickerRowText,
                              active && styles.pickerRowTextActive,
                            ]}
                          >
                            {hour}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.pickerCol}>
                  <AppText style={styles.pickerLabel}>Minute</AppText>
                  <ScrollView
                    style={styles.pickerScroll}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {MINUTES.map((minute) => {
                      const active = minute === pickerMinute;
                      return (
                        <Pressable
                          key={minute}
                          style={[
                            styles.pickerRow,
                            active && styles.pickerRowActive,
                          ]}
                          onPress={() => setPickerMinute(minute)}
                        >
                          <AppText
                            style={[
                              styles.pickerRowText,
                              active && styles.pickerRowTextActive,
                            ]}
                          >
                            {minute}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.pickerActions}>
                <Pressable
                  style={styles.saveBtn}
                  onPress={() => {
                    setForm((prev) => ({
                      ...prev,
                      time: `${pickerHour}:${pickerMinute}`,
                    }));
                    setShowTimePicker(false);
                  }}
                >
                  <AppText style={styles.saveBtnText}>Done</AppText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        <MonthCalendarModal
          visible={showDatePicker}
          initialDate={parseDateKey(form.date) ?? date}
          onClose={() => setShowDatePicker(false)}
          onSelect={(selectedDate) => {
            setForm((prev) => ({ ...prev, date: formatDateKey(selectedDate) }));
            setShowDatePicker(false);
          }}
        />
      </Screen>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: "flex-start",
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
  heroMetaRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  heroMetaChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.2)",
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroMetaText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
    color: theme.colors.brand.dark,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    alignItems: "center",
    minHeight: 96,
  },
  metricValue: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.lg,
  },
  metricLabel: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  addAppointmentCta: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.2)",
    backgroundColor: "rgba(234,243,251,0.78)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addAppointmentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74,144,226,0.14)",
  },
  addAppointmentTitle: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.sm,
  },
  addAppointmentSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.sm,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  sectionTitleRow: {
    marginBottom: 10,
  },
  modeWrap: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  modeChipActive: {
    borderColor: "rgba(74,144,226,0.24)",
    backgroundColor: "rgba(74,144,226,0.12)",
  },
  modeChipText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
  modeChipTextActive: {
    color: theme.colors.brand.dark,
  },
  filtersWrap: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  filterChipActive: {
    borderColor: "rgba(74,144,226,0.24)",
    backgroundColor: "rgba(74,144,226,0.12)",
  },
  filterChipText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: theme.colors.brand.dark,
  },
  listWrap: {
    gap: 10,
  },
  itemRow: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(234,243,251,0.65)",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.14)",
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemTitle: {
    flex: 1,
    marginRight: 8,
    fontSize: theme.typography.fontSize.md,
  },
  itemTime: {
    fontWeight: "700",
    color: theme.colors.brand.dark,
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  itemMetaText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  itemNote: {
    marginTop: 6,
    color: theme.colors.text.primary,
  },
  rowActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusUpcoming: {
    backgroundColor: "rgba(74,144,226,0.18)",
  },
  statusMissed: {
    backgroundColor: "rgba(209,67,67,0.16)",
  },
  statusCompleted: {
    backgroundColor: "rgba(47,133,90,0.18)",
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  completeBtn: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(74,144,226,0.14)",
  },
  completeBtnText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.brand.dark,
    fontWeight: "600",
  },
  emptyWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.14)",
    padding: 12,
  },
  emptyText: {
    color: theme.colors.text.secondary,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 10,
    maxHeight: "88%",
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: theme.typography.fontSize.sm,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
  },
  inputHalf: {
    flex: 1,
  },
  timePickerTrigger: {
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.16)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    justifyContent: "center",
  },
  timePickerTriggerText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputArea: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 14,
    maxHeight: "86%",
  },
  pickerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  pickerSelectedTime: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.sm,
  },
  pickerCols: {
    flexDirection: "row",
    gap: 10,
  },
  pickerCol: {
    flex: 1,
  },
  pickerLabel: {
    marginBottom: 6,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  pickerScroll: {
    maxHeight: 220,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.12)",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  pickerRow: {
    paddingVertical: 9,
    alignItems: "center",
  },
  pickerRowActive: {
    backgroundColor: "rgba(74,144,226,0.14)",
  },
  pickerRowText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
  pickerRowTextActive: {
    color: theme.colors.brand.dark,
    fontWeight: "700",
  },
  pickerActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalActions: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.18)",
  },
  cancelBtnText: {
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  saveBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: theme.colors.brand.primary,
  },
  saveBtnText: {
    color: "white",
    fontWeight: "700",
  },
});
