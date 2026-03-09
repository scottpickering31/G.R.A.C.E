import {
  useCreateMedication,
  useRxNormSearch,
} from "@/src/api/medications/hooks";
import AppText from "@/src/components/AppText";
import MonthCalendarModal from "@/src/components/calendar/MonthCalendarModal";
import SkeletonBlock from "@/src/components/loading/SkeletonBlock";
import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import { Calendar, Info, Search } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  patientId?: string;
  userId?: string;
};

type ScheduleType = "as_needed" | "daily_same_time" | "one_off";

const HOURS_24 = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const DOSE_UNITS = [
  "mg",
  "mcg",
  "g",
  "ml",
  "L",
  "units",
  "drops",
  "tablets",
  "capsules",
  "puffs",
  "patches",
  "sachets",
];
const ROUTE_OPTIONS = [
  { value: "oral", label: "Oral" },
  { value: "sublingual", label: "Sublingual" },
  { value: "buccal", label: "Buccal" },
  { value: "enteral_tube", label: "Enteral tube" },
  { value: "rectal", label: "Rectal" },
  { value: "vaginal", label: "Vaginal" },
  { value: "topical", label: "Topical" },
  { value: "transdermal", label: "Transdermal patch" },
  { value: "inhalation", label: "Inhalation" },
  { value: "nebulized", label: "Nebulized" },
  { value: "intranasal", label: "Intranasal" },
  { value: "ophthalmic", label: "Eye drops (ophthalmic)" },
  { value: "otic", label: "Ear drops (otic)" },
  { value: "subcutaneous", label: "Subcutaneous injection" },
  { value: "intramuscular", label: "Intramuscular injection" },
  { value: "intravenous", label: "Intravenous" },
  { value: "intradermal", label: "Intradermal" },
  { value: "other", label: "Other" },
] as const;
type MedicationRoute = (typeof ROUTE_OPTIONS)[number]["value"];

function normalizeDose(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function formatTime12Hour(hour24: string, minute: string) {
  const hourNum = Number(hour24);
  const suffix = hourNum >= 12 ? "PM" : "AM";
  const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${hour12}:${minute} ${suffix}`;
}

function sanitizeDecimalInput(raw: string) {
  const normalized = raw.replace(",", ".").replace(/[^0-9.]/g, "");
  const [head, ...tail] = normalized.split(".");
  if (tail.length === 0) return head;
  return `${head}.${tail.join("")}`;
}

function formatDateISO(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export default function AddMedicationModal({
  visible,
  onClose,
  patientId,
  userId,
}: Props) {
  const { showToast } = useUIStore();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRxcui, setSelectedRxcui] = useState<string | null>(null);

  const [doseQuantity, setDoseQuantity] = useState("");
  const [doseUnit, setDoseUnit] = useState("mg");
  const [showDoseUnits, setShowDoseUnits] = useState(false);
  const [route, setRoute] = useState<MedicationRoute>("oral");
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [instructions, setInstructions] = useState("");

  const [scheduleType, setScheduleType] = useState<ScheduleType>("as_needed");
  const [dailyHour, setDailyHour] = useState("08");
  const [dailyMinute, setDailyMinute] = useState("00");
  const [showDailyTimePicker, setShowDailyTimePicker] = useState(false);
  const [dailyTimes, setDailyTimes] = useState<string[]>([]);
  const [oneOffDate, setOneOffDate] = useState<Date | null>(null);
  const [oneOffHour, setOneOffHour] = useState("14");
  const [oneOffMinute, setOneOffMinute] = useState("00");
  const [showOneOffTimePicker, setShowOneOffTimePicker] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [expiresAtDate, setExpiresAtDate] = useState<Date | null>(null);
  const [expiresCalendarVisible, setExpiresCalendarVisible] = useState(false);

  const [stockQuantity, setStockQuantity] = useState("");
  const [stockUnit, setStockUnit] = useState("tablets");
  const [showStockUnits, setShowStockUnits] = useState(false);
  const [stockUnitOverridden, setStockUnitOverridden] = useState(false);
  const [lowStockMode, setLowStockMode] = useState<"absolute" | "percent">(
    "absolute",
  );
  const [lowStockAbsoluteQty, setLowStockAbsoluteQty] = useState("");
  const [lowStockAbsoluteUnit, setLowStockAbsoluteUnit] = useState("tablets");
  const [showLowStockUnits, setShowLowStockUnits] = useState(false);
  const [lowStockUnitOverridden, setLowStockUnitOverridden] = useState(false);
  const [lowStockPercent, setLowStockPercent] = useState(25);
  const [sliderTrackWidth, setSliderTrackWidth] = useState(0);
  const [openHelpKey, setOpenHelpKey] = useState<string | null>(null);

  const { data: suggestions = [], isLoading: searching } =
    useRxNormSearch(debouncedSearch);
  const createMedication = useCreateMedication();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const selected = useMemo(
    () => suggestions.find((item) => item.rxcui === selectedRxcui) ?? null,
    [suggestions, selectedRxcui],
  );
  const routeLabel =
    ROUTE_OPTIONS.find((option) => option.value === route)?.label ?? "Oral";

  useEffect(() => {
    if (visible) return;
    setSearch("");
    setDebouncedSearch("");
    setSelectedRxcui(null);
    setDoseQuantity("");
    setDoseUnit("mg");
    setShowDoseUnits(false);
    setRoute("oral");
    setShowRouteOptions(false);
    setInstructions("");
    setScheduleType("as_needed");
    setDailyHour("08");
    setDailyMinute("00");
    setShowDailyTimePicker(false);
    setDailyTimes([]);
    setOneOffDate(null);
    setOneOffHour("14");
    setOneOffMinute("00");
    setShowOneOffTimePicker(false);
    setCalendarVisible(false);
    setExpiresAtDate(null);
    setExpiresCalendarVisible(false);
    setStockQuantity("");
    setStockUnit("tablets");
    setShowStockUnits(false);
    setStockUnitOverridden(false);
    setLowStockMode("absolute");
    setLowStockAbsoluteQty("");
    setLowStockAbsoluteUnit("tablets");
    setShowLowStockUnits(false);
    setLowStockUnitOverridden(false);
    setLowStockPercent(25);
    setSliderTrackWidth(0);
    setOpenHelpKey(null);
  }, [visible]);

  const close = () => {
    if (createMedication.isPending) return;
    setShowDoseUnits(false);
    setShowStockUnits(false);
    setShowLowStockUnits(false);
    setShowRouteOptions(false);
    setShowDailyTimePicker(false);
    setShowOneOffTimePicker(false);
    setExpiresCalendarVisible(false);
    setOpenHelpKey(null);
    onClose();
  };

  const selectedDailyTime = `${dailyHour}:${dailyMinute}:00`;
  const currentStockQtyValue = toOptionalNumber(stockQuantity);
  const canUsePercentThreshold =
    currentStockQtyValue !== undefined && currentStockQtyValue > 0;

  const clampPercent = (value: number) => {
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Math.round(value);
  };

  const updateLowStockPercentByX = useCallback(
    (x: number) => {
      if (sliderTrackWidth <= 0) return;
      const ratio = x / sliderTrackWidth;
      setLowStockPercent(clampPercent(ratio * 100));
    },
    [sliderTrackWidth],
  );

  const sliderPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) =>
          updateLowStockPercentByX(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) =>
          updateLowStockPercentByX(evt.nativeEvent.locationX),
      }),
    [updateLowStockPercentByX],
  );

  const addDailyTime = () => {
    setDailyTimes((prev) => {
      if (prev.includes(selectedDailyTime)) return prev;
      return [...prev, selectedDailyTime].sort((a, b) => a.localeCompare(b));
    });
  };

  const removeDailyTime = (time: string) => {
    setDailyTimes((prev) => prev.filter((t) => t !== time));
  };

  useEffect(() => {
    if (!canUsePercentThreshold && lowStockMode === "percent") {
      setLowStockMode("absolute");
    }
  }, [canUsePercentThreshold, lowStockMode]);

  const toggleHelp = (key: string) => {
    setOpenHelpKey((prev) => (prev === key ? null : key));
  };

  const renderFieldLabel = (
    label: string,
    helpKey: string,
    helpText: string,
  ) => (
    <>
      <View style={styles.labelRow}>
        <AppText weight="semibold" style={styles.label}>
          {label}
        </AppText>
        <Pressable
          style={styles.infoButton}
          onPress={() => toggleHelp(helpKey)}
        >
          <Info size={14} color="rgba(31,45,61,0.72)" />
        </Pressable>
      </View>
      {openHelpKey === helpKey ? (
        <AppText style={styles.helpText}>{helpText}</AppText>
      ) : null}
    </>
  );

  const saveMedication = async () => {
    if (!patientId || !userId) {
      showToast(
        "Could not find your patient context. Please refresh.",
        "error",
      );
      return;
    }

    const medicationName = selected?.name ?? search.trim();
    if (medicationName.length < 2) {
      showToast("Select a medication or enter at least 2 characters.", "error");
      return;
    }

    let oneOffDueAt: string | undefined;

    if (scheduleType === "daily_same_time") {
      if (dailyTimes.length === 0) {
        showToast("Add at least one daily time.", "error");
        return;
      }
    }

    if (scheduleType === "one_off") {
      if (!oneOffDate) {
        showToast("Choose the one-off date.", "error");
        return;
      }
      oneOffDueAt = new Date(
        oneOffDate.getFullYear(),
        oneOffDate.getMonth(),
        oneOffDate.getDate(),
        Number(oneOffHour),
        Number(oneOffMinute),
      ).toISOString();
    }

    const normalizedDoseQuantity = doseQuantity.trim();
    const doseQuantityNumber = normalizedDoseQuantity
      ? Number(normalizedDoseQuantity)
      : undefined;
    if (normalizedDoseQuantity) {
      if (
        doseQuantityNumber === undefined ||
        !Number.isFinite(doseQuantityNumber) ||
        doseQuantityNumber <= 0
      ) {
        showToast("Dose quantity must be a positive number.", "error");
        return;
      }
    }
    const doseValue = normalizedDoseQuantity
      ? normalizeDose(`${normalizedDoseQuantity} ${doseUnit}`)
      : "";

    const stockQtyValue = toOptionalNumber(stockQuantity);

    if (stockQuantity.trim() && stockQtyValue === undefined) {
      showToast("Stock quantity must be a positive number.", "error");
      return;
    }

    let lowThresholdValue: number | undefined;
    if (lowStockMode === "absolute") {
      const parsed = toOptionalNumber(lowStockAbsoluteQty);
      if (lowStockAbsoluteQty.trim() && parsed === undefined) {
        showToast("Low-stock threshold must be a positive number.", "error");
        return;
      }

      if (
        parsed !== undefined &&
        stockUnit.trim() &&
        lowStockAbsoluteUnit.trim() &&
        stockUnit.trim().toLowerCase() !==
          lowStockAbsoluteUnit.trim().toLowerCase()
      ) {
        showToast(
          "Low-stock unit should match current stock unit for accurate alerts.",
          "error",
        );
        return;
      }

      lowThresholdValue = parsed;
    } else {
      if (stockQtyValue === undefined) {
        showToast(
          "Enter current stock first to use percentage threshold.",
          "error",
        );
        return;
      }
      lowThresholdValue = Number(
        ((stockQtyValue * lowStockPercent) / 100).toFixed(2),
      );
    }

    try {
      await createMedication.mutateAsync({
        patientId,
        userId,
        name: medicationName,
        dose: doseValue,
        route,
        instructions,
        scheduleType,
        dailyTimes,
        oneOffDueAt,
        expiresAt: expiresAtDate ? formatDateISO(expiresAtDate) : undefined,
        stockQuantity: stockQtyValue,
        stockUnit,
        lowStockThreshold: lowThresholdValue,
      });
      showToast("Medication added.", "success");
      onClose();
    } catch (e: any) {
      showToast(e?.message ?? "Could not add medication.", "error");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 16 + Math.max(insets.bottom, 8) }]}
          onPress={() => {}}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 8) }}
          >
            <View style={styles.header}>
              <AppText weight="bold" style={styles.title}>
                Add Medication
              </AppText>
              <AppText style={styles.subtitle}>
                Add medicine details, schedule preference, and stock tracking.
              </AppText>
            </View>

            {renderFieldLabel(
              "Medication name",
              "medication_name",
              "Type the medicine name. Autocomplete suggestions come from RxNorm to help with spelling and consistency.",
            )}
            <View style={styles.inputWrap}>
              <Search size={16} color="rgba(31,45,61,0.55)" />
              <TextInput
                value={search}
                onChangeText={(value) => {
                  setSearch(value);
                  setSelectedRxcui(null);
                }}
                placeholder="Start typing medication name"
                placeholderTextColor="rgba(31,45,61,0.42)"
                style={styles.searchInput}
                autoCapitalize="words"
              />
            </View>

            {(searching || suggestions.length > 0) && (
              <View style={styles.suggestionsCard}>
                {searching ? (
                  <View style={styles.searchSkeletonWrap}>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <View key={`search-skeleton-${index}`} style={styles.searchSkeletonRow}>
                        <SkeletonBlock width="68%" height={14} />
                        <View style={{ height: 6 }} />
                        <SkeletonBlock width="44%" height={12} />
                      </View>
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    style={styles.suggestionsScroll}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {suggestions.map((item) => {
                      const active = item.rxcui === selectedRxcui;
                      return (
                        <Pressable
                          key={item.rxcui}
                          style={[
                            styles.suggestionRow,
                            active && styles.suggestionRowActive,
                          ]}
                          onPress={() => {
                            setSelectedRxcui(item.rxcui);
                            setSearch(item.name);
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <AppText
                              weight="semibold"
                              style={styles.suggestionName}
                            >
                              {item.name}
                            </AppText>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}

            <View style={styles.field}>
              {renderFieldLabel(
                "Dose (optional)",
                "dose",
                "Enter the amount given each time, for example 5 ml or 250 mg.",
              )}
              <View style={styles.doseRow}>
                <TextInput
                  value={doseQuantity}
                  onChangeText={(text) =>
                    setDoseQuantity(sanitizeDecimalInput(text))
                  }
                  placeholder="Qty"
                  keyboardType="decimal-pad"
                  placeholderTextColor="rgba(31,45,61,0.42)"
                  style={[styles.input, styles.doseQtyInput]}
                />
                <Pressable
                  style={[styles.input, styles.doseUnitButton]}
                  onPress={() => setShowDoseUnits((prev) => !prev)}
                >
                  <AppText style={styles.doseUnitText}>{doseUnit}</AppText>
                </Pressable>
              </View>
              {showDoseUnits ? (
                <View style={styles.unitDropdown}>
                  <ScrollView
                    style={styles.unitDropdownScroll}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {DOSE_UNITS.map((unit) => {
                      const active = unit === doseUnit;
                      return (
                        <Pressable
                          key={unit}
                          style={[
                            styles.unitRow,
                            active && styles.unitRowActive,
                          ]}
                          onPress={() => {
                            setDoseUnit(unit);
                            if (!stockUnitOverridden) setStockUnit(unit);
                            if (!lowStockUnitOverridden)
                              setLowStockAbsoluteUnit(unit);
                            setShowDoseUnits(false);
                          }}
                        >
                          <AppText
                            style={[
                              styles.unitRowText,
                              active && styles.unitRowTextActive,
                            ]}
                          >
                            {unit}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              {renderFieldLabel(
                "Route of administration",
                "route",
                "Select how the medication is given, for example oral, inhalation, intravenous, or topical.",
              )}
              <Pressable
                style={styles.input}
                onPress={() => setShowRouteOptions((prev) => !prev)}
              >
                <AppText style={styles.doseUnitText}>{routeLabel}</AppText>
              </Pressable>
              {showRouteOptions ? (
                <View style={styles.unitDropdown}>
                  <ScrollView
                    style={styles.unitDropdownScroll}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {ROUTE_OPTIONS.map((option) => {
                      const active = option.value === route;
                      return (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.unitRow,
                            active && styles.unitRowActive,
                          ]}
                          onPress={() => {
                            setRoute(option.value);
                            setShowRouteOptions(false);
                          }}
                        >
                          <AppText
                            style={[
                              styles.unitRowText,
                              active && styles.unitRowTextActive,
                            ]}
                          >
                            {option.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              {renderFieldLabel(
                "Schedule",
                "schedule",
                "Choose As needed, Daily same time, or One-off depending on how this medication is used.",
              )}
              <View style={styles.scheduleRow}>
                {(
                  [
                    ["as_needed", "As needed"],
                    ["daily_same_time", "Daily same time"],
                    ["one_off", "One-off"],
                  ] as [ScheduleType, string][]
                ).map(([value, label]) => {
                  const active = scheduleType === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setScheduleType(value)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <AppText
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {scheduleType === "daily_same_time" ? (
              <View style={styles.field}>
                {renderFieldLabel(
                  "Daily times",
                  "daily_times",
                  "Pick a time and tap Add this time. Add multiple times for medicines given more than once daily.",
                )}
                <Pressable
                  style={styles.timePickerTrigger}
                  onPress={() => setShowDailyTimePicker(true)}
                >
                  <AppText style={styles.timePickerTriggerText}>
                    {formatTime12Hour(dailyHour, dailyMinute)}
                  </AppText>
                </Pressable>
                <View style={styles.dailyActionsRow}>
                  <Pressable
                    style={styles.smallActionButton}
                    onPress={addDailyTime}
                  >
                    <AppText weight="semibold" style={styles.smallActionText}>
                      Add this time
                    </AppText>
                  </Pressable>
                  {dailyTimes.length > 0 ? (
                    <Pressable
                      style={styles.smallGhostButton}
                      onPress={() => setDailyTimes([])}
                    >
                      <AppText style={styles.smallGhostText}>Clear all</AppText>
                    </Pressable>
                  ) : null}
                </View>
                {dailyTimes.length > 0 ? (
                  <View style={styles.dailyTimesWrap}>
                    {dailyTimes.map((time) => {
                      const [hour, minute] = time.slice(0, 5).split(":");
                      return (
                        <Pressable
                          key={time}
                          style={styles.dailyTimeChip}
                          onPress={() => removeDailyTime(time)}
                        >
                          <AppText style={styles.dailyTimeChipText}>
                            {formatTime12Hour(hour, minute)} x
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <AppText style={styles.helperTextMuted}>
                    Add one or more daily dose times.
                  </AppText>
                )}
              </View>
            ) : null}

            {scheduleType === "one_off" ? (
              <>
                <View style={styles.field}>
                  {renderFieldLabel(
                    "One-off date",
                    "one_off_date",
                    "Choose the calendar date for this single dose.",
                  )}
                  <Pressable
                    style={styles.dateInputWrap}
                    onPress={() => setCalendarVisible(true)}
                  >
                    <Calendar size={16} color="rgba(31,45,61,0.6)" />
                    <AppText style={styles.dateInputText}>
                      {oneOffDate ? formatDateISO(oneOffDate) : "Select date"}
                    </AppText>
                  </Pressable>
                </View>
                <View style={styles.field}>
                  {renderFieldLabel(
                    "One-off time",
                    "one_off_time",
                    "Choose the exact time this one-off dose should be due.",
                  )}
                  <Pressable
                    style={styles.timePickerTrigger}
                    onPress={() => setShowOneOffTimePicker(true)}
                  >
                    <AppText style={styles.timePickerTriggerText}>
                      {formatTime12Hour(oneOffHour, oneOffMinute)}
                    </AppText>
                  </Pressable>
                </View>
              </>
            ) : null}

            <View style={styles.field}>
              {renderFieldLabel(
                "Current stock (optional)",
                "stock",
                "Enter how much you currently have available, for example 60 tablets or 120 ml.",
              )}
              <View style={styles.stockRow}>
                <TextInput
                  value={stockQuantity}
                  onChangeText={(text) =>
                    setStockQuantity(sanitizeDecimalInput(text))
                  }
                  placeholder="Quantity"
                  keyboardType="decimal-pad"
                  placeholderTextColor="rgba(31,45,61,0.42)"
                  style={[styles.input, styles.stockInput]}
                />
                <Pressable
                  style={[styles.input, styles.stockInput]}
                  onPress={() => setShowStockUnits((prev) => !prev)}
                >
                  <AppText style={styles.doseUnitText}>{stockUnit}</AppText>
                </Pressable>
              </View>
              {showStockUnits ? (
                <View style={styles.unitDropdown}>
                  <ScrollView
                    style={styles.unitDropdownScroll}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {DOSE_UNITS.map((unit) => {
                      const active = unit === stockUnit;
                      return (
                        <Pressable
                          key={`stock-${unit}`}
                          style={[
                            styles.unitRow,
                            active && styles.unitRowActive,
                          ]}
                          onPress={() => {
                            setStockUnit(unit);
                            setStockUnitOverridden(true);
                            setShowStockUnits(false);
                          }}
                        >
                          <AppText
                            style={[
                              styles.unitRowText,
                              active && styles.unitRowTextActive,
                            ]}
                          >
                            {unit}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              {renderFieldLabel(
                "Low-stock Notification Threshold",
                "low_stock",
                "Set the point where the app should consider stock low. Use a fixed quantity or a percentage of current stock.",
              )}
              <View style={styles.thresholdModeRow}>
                <Pressable
                  style={[
                    styles.thresholdModeChip,
                    lowStockMode === "absolute" &&
                      styles.thresholdModeChipActive,
                  ]}
                  onPress={() => setLowStockMode("absolute")}
                >
                  <AppText
                    style={[
                      styles.thresholdModeText,
                      lowStockMode === "absolute" &&
                        styles.thresholdModeTextActive,
                    ]}
                  >
                    Qty + unit
                  </AppText>
                </Pressable>
                <Pressable
                  style={[
                    styles.thresholdModeChip,
                    lowStockMode === "percent" &&
                      styles.thresholdModeChipActive,
                    !canUsePercentThreshold && styles.thresholdModeChipDisabled,
                  ]}
                  onPress={() => {
                    if (!canUsePercentThreshold) return;
                    setLowStockMode("percent");
                  }}
                >
                  <AppText
                    style={[
                      styles.thresholdModeText,
                      lowStockMode === "percent" &&
                        styles.thresholdModeTextActive,
                      !canUsePercentThreshold &&
                        styles.thresholdModeTextDisabled,
                    ]}
                  >
                    % of stock
                  </AppText>
                </Pressable>
              </View>
              {!canUsePercentThreshold ? (
                <AppText style={styles.helperTextMuted}>
                  Add Current stock quantity above to enable percentage
                  threshold.
                </AppText>
              ) : null}

              {lowStockMode === "absolute" ? (
                <>
                  <View style={styles.stockRow}>
                    <TextInput
                      value={lowStockAbsoluteQty}
                      onChangeText={(text) =>
                        setLowStockAbsoluteQty(sanitizeDecimalInput(text))
                      }
                      placeholder="Threshold qty"
                      keyboardType="decimal-pad"
                      placeholderTextColor="rgba(31,45,61,0.42)"
                      style={[styles.input, styles.stockInput]}
                    />
                    <Pressable
                      style={[styles.input, styles.stockInput]}
                      onPress={() => setShowLowStockUnits((prev) => !prev)}
                    >
                      <AppText style={styles.doseUnitText}>
                        {lowStockAbsoluteUnit}
                      </AppText>
                    </Pressable>
                  </View>
                  {showLowStockUnits ? (
                    <View style={styles.unitDropdown}>
                      <ScrollView
                        style={styles.unitDropdownScroll}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                      >
                        {DOSE_UNITS.map((unit) => {
                          const active = unit === lowStockAbsoluteUnit;
                          return (
                            <Pressable
                              key={`threshold-${unit}`}
                              style={[
                                styles.unitRow,
                                active && styles.unitRowActive,
                              ]}
                              onPress={() => {
                                setLowStockAbsoluteUnit(unit);
                                setLowStockUnitOverridden(true);
                                setShowLowStockUnits(false);
                              }}
                            >
                              <AppText
                                style={[
                                  styles.unitRowText,
                                  active && styles.unitRowTextActive,
                                ]}
                              >
                                {unit}
                              </AppText>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.sliderCard}>
                  <View
                    style={styles.sliderTrack}
                    onLayout={(e) =>
                      setSliderTrackWidth(e.nativeEvent.layout.width)
                    }
                    {...sliderPanResponder.panHandlers}
                  >
                    <View
                      style={[
                        styles.sliderFill,
                        { width: `${lowStockPercent}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.sliderThumb,
                        { left: `${lowStockPercent}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.sliderRow}>
                    <AppText style={styles.sliderLabel}>0%</AppText>
                    <AppText weight="semibold" style={styles.sliderValue}>
                      {lowStockPercent}% of current stock
                    </AppText>
                    <AppText style={styles.sliderLabel}>100%</AppText>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.field}>
              {renderFieldLabel(
                "Expires at (optional)",
                "expires_at",
                "Set the medication expiry date from the packaging so you can replace it in time.",
              )}
              <Pressable
                style={styles.dateInputWrap}
                onPress={() => setExpiresCalendarVisible(true)}
              >
                <Calendar size={16} color="rgba(31,45,61,0.6)" />
                <AppText style={styles.dateInputText}>
                  {expiresAtDate ? formatDateISO(expiresAtDate) : "Select expiry date"}
                </AppText>
              </Pressable>
            </View>

            <View style={styles.field}>
              {renderFieldLabel(
                "Instructions (optional)",
                "instructions",
                "Add extra administration notes for carers, for example Take after food or Do not crush.",
              )}
              <TextInput
                value={instructions}
                onChangeText={setInstructions}
                placeholder="e.g. Take after breakfast"
                placeholderTextColor="rgba(31,45,61,0.42)"
                style={[styles.input, styles.instructionsInput]}
                multiline
              />
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.secondaryButton} onPress={close}>
                <AppText weight="semibold" style={styles.secondaryButtonText}>
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  createMedication.isPending && styles.primaryButtonBusy,
                ]}
                onPress={saveMedication}
                disabled={createMedication.isPending}
              >
                {createMedication.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <AppText weight="semibold" style={styles.primaryButtonText}>
                    Add
                  </AppText>
                )}
              </Pressable>
            </View>
          </ScrollView>

          <MonthCalendarModal
            visible={calendarVisible}
            initialDate={oneOffDate ?? new Date()}
            onClose={() => setCalendarVisible(false)}
            onSelect={(selectedDate) => {
              setOneOffDate(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  selectedDate.getDate(),
                ),
              );
              setCalendarVisible(false);
            }}
          />

          <MonthCalendarModal
            visible={expiresCalendarVisible}
            initialDate={expiresAtDate ?? new Date()}
            onClose={() => setExpiresCalendarVisible(false)}
            onSelect={(selectedDate) => {
              setExpiresAtDate(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  selectedDate.getDate(),
                ),
              );
              setExpiresCalendarVisible(false);
            }}
          />

          <Modal
            visible={showDailyTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDailyTimePicker(false)}
          >
            <Pressable
              style={styles.pickerBackdrop}
              onPress={() => setShowDailyTimePicker(false)}
            >
              <Pressable style={styles.pickerSheet} onPress={() => {}}>
                <View style={styles.pickerTitleRow}>
                  <AppText weight="bold" style={styles.pickerTitle}>
                    Select Daily Time
                  </AppText>
                  <AppText weight="semibold" style={styles.pickerSelectedTime}>
                    {formatTime12Hour(dailyHour, dailyMinute)}
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
                        const active = hour === dailyHour;
                        return (
                          <Pressable
                            key={hour}
                            style={[
                              styles.pickerRow,
                              active && styles.pickerRowActive,
                            ]}
                            onPress={() => setDailyHour(hour)}
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
                        const active = minute === dailyMinute;
                        return (
                          <Pressable
                            key={minute}
                            style={[
                              styles.pickerRow,
                              active && styles.pickerRowActive,
                            ]}
                            onPress={() => setDailyMinute(minute)}
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
                    style={styles.primaryButton}
                    onPress={() => {
                      addDailyTime();
                      setShowDailyTimePicker(false);
                    }}
                  >
                    <AppText weight="semibold" style={styles.primaryButtonText}>
                      Add time
                    </AppText>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setShowDailyTimePicker(false)}
                  >
                    <AppText
                      weight="semibold"
                      style={styles.secondaryButtonText}
                    >
                      Done
                    </AppText>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          <Modal
            visible={showOneOffTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowOneOffTimePicker(false)}
          >
            <Pressable
              style={styles.pickerBackdrop}
              onPress={() => setShowOneOffTimePicker(false)}
            >
              <Pressable style={styles.pickerSheet} onPress={() => {}}>
                <View style={styles.pickerTitleRow}>
                  <AppText weight="bold" style={styles.pickerTitle}>
                    Select One-off Time
                  </AppText>
                  <AppText weight="semibold" style={styles.pickerSelectedTime}>
                    {formatTime12Hour(oneOffHour, oneOffMinute)}
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
                        const active = hour === oneOffHour;
                        return (
                          <Pressable
                            key={`oneoff-hour-${hour}`}
                            style={[
                              styles.pickerRow,
                              active && styles.pickerRowActive,
                            ]}
                            onPress={() => setOneOffHour(hour)}
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
                        const active = minute === oneOffMinute;
                        return (
                          <Pressable
                            key={`oneoff-minute-${minute}`}
                            style={[
                              styles.pickerRow,
                              active && styles.pickerRowActive,
                            ]}
                            onPress={() => setOneOffMinute(minute)}
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
                    style={styles.secondaryButton}
                    onPress={() => setShowOneOffTimePicker(false)}
                  >
                    <AppText
                      weight="semibold"
                      style={styles.secondaryButtonText}
                    >
                      Done
                    </AppText>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
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
    maxHeight: "92%",
  },
  header: { gap: 4 },
  title: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  inputWrap: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    paddingVertical: 10,
  },
  suggestionsCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.25)",
    backgroundColor: "rgba(74, 144, 226, 0.06)",
    maxHeight: 220,
    overflow: "hidden",
  },
  suggestionsScroll: {
    paddingVertical: 4,
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(31,45,61,0.12)",
  },
  suggestionRowActive: {
    backgroundColor: "rgba(74,144,226,0.16)",
  },
  suggestionName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  searchSkeletonWrap: {
    paddingVertical: 8,
    gap: 8,
  },
  searchSkeletonRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.08)",
    backgroundColor: "rgba(248,251,255,0.72)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  field: { marginTop: 12, gap: 6 },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoButton: {
    width: 18,
    height: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.2)",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  helpText: {
    marginTop: 4,
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 16,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  doseRow: {
    flexDirection: "row",
    gap: 8,
  },
  doseQtyInput: {
    flex: 1,
  },
  doseUnitButton: {
    width: 120,
    justifyContent: "center",
  },
  doseUnitText: {
    color: theme.colors.text.primary,
  },
  unitDropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "white",
    overflow: "hidden",
  },
  unitDropdownScroll: {
    maxHeight: 180,
  },
  unitRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(31,45,61,0.1)",
  },
  unitRowActive: {
    backgroundColor: "rgba(74,144,226,0.14)",
  },
  unitRowText: {
    color: theme.colors.text.primary,
    textTransform: "none",
  },
  unitRowTextActive: {
    color: theme.colors.brand.dark,
  },
  scheduleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.15)",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  chipActive: {
    backgroundColor: "rgba(74,144,226,0.16)",
    borderColor: "rgba(74,144,226,0.28)",
  },
  chipText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  chipTextActive: {
    color: theme.colors.brand.dark,
  },
  dateInputWrap: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInputText: {
    color: theme.colors.text.primary,
  },
  timePickerTrigger: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  timePickerTriggerText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
  dailyActionsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  smallActionButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(74,144,226,0.14)",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.24)",
  },
  smallActionText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.sm,
  },
  smallGhostButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallGhostText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  dailyTimesWrap: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dailyTimeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(74,144,226,0.12)",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.2)",
  },
  dailyTimeChipText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.sm,
  },
  helperTextMuted: {
    marginTop: 6,
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
  },
  thresholdModeRow: {
    flexDirection: "row",
    gap: 8,
  },
  thresholdModeChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.15)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 8,
    alignItems: "center",
  },
  thresholdModeChipActive: {
    borderColor: "rgba(74,144,226,0.28)",
    backgroundColor: "rgba(74,144,226,0.16)",
  },
  thresholdModeChipDisabled: {
    opacity: 0.45,
  },
  thresholdModeText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  thresholdModeTextActive: {
    color: theme.colors.brand.dark,
  },
  thresholdModeTextDisabled: {
    color: theme.colors.text.muted,
  },
  sliderCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 10,
    gap: 8,
  },
  sliderTrack: {
    position: "relative",
    height: 20,
    borderRadius: 999,
    backgroundColor: "rgba(31,45,61,0.08)",
    justifyContent: "center",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "rgba(74,144,226,0.35)",
  },
  sliderThumb: {
    position: "absolute",
    top: 2,
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "#4A90E2",
    borderWidth: 2,
    borderColor: "white",
  },
  sliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
  },
  sliderValue: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.sm,
  },
  stockRow: {
    flexDirection: "row",
    gap: 8,
  },
  stockInput: {
    flex: 1,
  },
  instructionsInput: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.18)",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonBusy: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: "white",
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  pickerSheet: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 14,
  },
  pickerTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  pickerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pickerSelectedTime: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.md,
  },
  pickerCols: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  pickerCol: {
    flex: 1,
  },
  pickerLabel: {
    marginBottom: 6,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  pickerScroll: {
    maxHeight: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(143, 162, 180, 0.35)",
    backgroundColor: "white",
  },
  pickerRow: {
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(31,45,61,0.1)",
  },
  pickerRowActive: {
    backgroundColor: "rgba(74,144,226,0.14)",
  },
  pickerRowText: {
    color: theme.colors.text.primary,
  },
  pickerRowTextActive: {
    color: theme.colors.brand.dark,
    fontWeight: "600",
  },
  pickerActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
});
