import {
  useDeleteMedication,
  useUpdateMedication,
} from "@/src/api/medications/hooks";
import { MedicationListItem } from "@/src/api/medications/service";
import AppText from "@/src/components/AppText";
import { theme } from "@/src/theme";
import { useUIStore } from "@/state/ui.store";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
  medication: MedicationListItem | null;
  patientId?: string;
  canEdit?: boolean;
};

const UNIT_OPTIONS = [
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
  "oral",
  "sublingual",
  "buccal",
  "enteral_tube",
  "rectal",
  "vaginal",
  "topical",
  "transdermal",
  "inhalation",
  "nebulized",
  "intranasal",
  "ophthalmic",
  "otic",
  "subcutaneous",
  "intramuscular",
  "intravenous",
  "intradermal",
  "other",
] as const;

type RouteOption = (typeof ROUTE_OPTIONS)[number];
type ScheduleType = "as_needed" | "daily_same_time" | "one_off";

function formatRoute(route: string) {
  const withSpaces = route.replace(/_/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function formatSchedule(med: MedicationListItem) {
  if (med.schedule_type === "daily_same_time" && med.schedule_times.length > 0) {
    const times = med.schedule_times
      .map((time) => {
        const [hour, minute] = time.slice(0, 5).split(":");
        const hourNum = Number(hour);
        const suffix = hourNum >= 12 ? "PM" : "AM";
        const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
        return `${hour12}:${minute} ${suffix}`;
      })
      .join(", ");
    return `Daily at ${times}`;
  }
  if (med.schedule_type === "one_off" && med.one_off_due_at) {
    const d = new Date(med.one_off_due_at);
    return `One-off ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return "As needed";
}

function parseDose(dose: string | null) {
  if (!dose) return { qty: "", unit: "mg" };
  const match = dose.trim().match(/^(\d+(?:\.\d+)?)\s*(.+)?$/);
  if (!match) return { qty: "", unit: "mg" };
  return {
    qty: match[1] ?? "",
    unit: match[2]?.trim() || "mg",
  };
}

function sanitizeDecimalInput(raw: string) {
  const normalized = raw.replace(",", ".").replace(/[^0-9.]/g, "");
  const [head, ...tail] = normalized.split(".");
  if (tail.length === 0) return head;
  return `${head}.${tail.join("")}`;
}

function toOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function toOneOffParts(oneOffDueAt: string | null) {
  if (!oneOffDueAt) return { date: "", time: "" };
  const d = new Date(oneOffDueAt);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
}

function toRunoutEstimate(med: MedicationListItem) {
  if (med.schedule_type !== "daily_same_time") {
    return "Run-out estimate is only available for daily schedules.";
  }
  if (med.schedule_times.length === 0) return "Add daily times to estimate run-out date.";
  if (med.stock_quantity == null || med.stock_quantity <= 0) {
    return "Add current stock to estimate run-out date.";
  }
  if (!med.dose) return "Add dose amount to estimate run-out date.";

  const doseMatch = med.dose.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!doseMatch) return "Dose format not recognized for estimate.";
  const doseQty = Number(doseMatch[1]);
  if (!Number.isFinite(doseQty) || doseQty <= 0) return "Dose must be greater than 0.";

  const doseUnit = (doseMatch[2] || "").trim().toLowerCase();
  const stockUnit = (med.stock_unit || "").trim().toLowerCase();
  if (doseUnit && stockUnit && doseUnit !== stockUnit) {
    return "Dose unit and stock unit differ; estimate unavailable.";
  }

  const timesPerDay = med.schedule_times.length;
  const perDayUsage = doseQty * timesPerDay;
  if (perDayUsage <= 0) return "Usage per day is not valid.";

  const daysRemaining = med.stock_quantity / perDayUsage;
  const runoutDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
  return `Estimated run-out: ${runoutDate.toLocaleDateString()} (${Math.max(
    0,
    Math.floor(daysRemaining),
  )} days left)`;
}

function getStockStatus(med: MedicationListItem) {
  if (med.stock_quantity == null) return { label: "Stock not set", tone: "neutral" as const };
  if (med.low_stock_threshold == null) {
    return { label: "Threshold not set", tone: "neutral" as const };
  }
  if (med.stock_quantity <= med.low_stock_threshold) {
    return { label: "Low stock: threshold reached", tone: "danger" as const };
  }
  if (med.stock_quantity <= med.low_stock_threshold * 1.25) {
    return { label: "Stock nearing threshold", tone: "warn" as const };
  }
  return { label: "Stock level healthy", tone: "good" as const };
}

function getStockThresholdProgress(med: MedicationListItem) {
  const qty = med.stock_quantity;
  const threshold = med.low_stock_threshold;

  if (qty == null || threshold == null || threshold <= 0) return null;

  const rawPercent = (qty / threshold) * 100;
  const clampedPercent = Math.max(0, Math.min(100, rawPercent));
  return {
    labelPercent: Math.round(clampedPercent),
    fillPercent: clampedPercent,
    isDanger: qty < threshold,
  };
}

export default function MedicationDetailModal({
  visible,
  onClose,
  medication,
  patientId,
  canEdit = true,
}: Props) {
  const { showToast } = useUIStore();
  const insets = useSafeAreaInsets();
  const updateMedication = useUpdateMedication(patientId);
  const deleteMedication = useDeleteMedication(patientId);

  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [showDoseUnits, setShowDoseUnits] = useState(false);
  const [showStockUnits, setShowStockUnits] = useState(false);

  const [name, setName] = useState("");
  const [doseQty, setDoseQty] = useState("");
  const [doseUnit, setDoseUnit] = useState("mg");
  const [route, setRoute] = useState<RouteOption>("oral");
  const [instructions, setInstructions] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("as_needed");
  const [dailyTimesCsv, setDailyTimesCsv] = useState("");
  const [oneOffDate, setOneOffDate] = useState("");
  const [oneOffTime, setOneOffTime] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [stockUnit, setStockUnit] = useState("tablets");
  const [lowThreshold, setLowThreshold] = useState("");
  const [refillAmount, setRefillAmount] = useState("");

  useEffect(() => {
    if (!medication || !visible) return;

    const parsedDose = parseDose(medication.dose);
    const oneOff = toOneOffParts(medication.one_off_due_at);

    setName(medication.name);
    setDoseQty(parsedDose.qty);
    setDoseUnit(parsedDose.unit);
    setRoute(medication.route);
    setInstructions(medication.instructions ?? "");
    setScheduleType(medication.schedule_type);
    setDailyTimesCsv(medication.schedule_times.map((t) => t.slice(0, 5)).join(", "));
    setOneOffDate(oneOff.date);
    setOneOffTime(oneOff.time);
    setExpiresAt(medication.expires_at ?? "");
    setStockQty(
      medication.stock_quantity == null ? "" : String(medication.stock_quantity),
    );
    setStockUnit(medication.stock_unit ?? "tablets");
    setLowThreshold(
      medication.low_stock_threshold == null
        ? ""
        : String(medication.low_stock_threshold),
    );
    setConfirmDelete(false);
    setIsEditing(false);
    setShowRouteOptions(false);
    setShowDoseUnits(false);
    setShowStockUnits(false);
    setRefillAmount("");
  }, [medication, visible]);

  useEffect(() => {
    if (canEdit) return;
    setIsEditing(false);
    setConfirmDelete(false);
  }, [canEdit]);

  if (!medication) return null;

  const stockState = getStockStatus(medication);
  const stockProgress = getStockThresholdProgress(medication);
  const runoutEstimate = toRunoutEstimate(medication);
  const refillBaseQty = medication.stock_quantity ?? 0;
  const refillParsedAmount = Number(refillAmount);
  const refillIsValidAmount =
    refillAmount.trim().length > 0 &&
    Number.isFinite(refillParsedAmount) &&
    refillParsedAmount > 0;
  const refillTargetQty =
    refillBaseQty + (refillIsValidAmount ? refillParsedAmount : 0);
  const canSubmitRefill = refillIsValidAmount;

  const onSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast("Medication name is required.", "error");
      return;
    }

    const normalizedDose = doseQty.trim()
      ? `${doseQty.trim()} ${doseUnit}`.trim()
      : "";

    const stockQtyVal = toOptionalNumber(stockQty);
    const lowThresholdVal = toOptionalNumber(lowThreshold);

    if (stockQty.trim() && stockQtyVal === undefined) {
      showToast("Current stock must be a positive number.", "error");
      return;
    }
    if (lowThreshold.trim() && lowThresholdVal === undefined) {
      showToast("Low-stock threshold must be a positive number.", "error");
      return;
    }

    const dailyTimes = dailyTimesCsv
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.length === 5 ? `${t}:00` : t));

    if (scheduleType === "daily_same_time" && dailyTimes.length === 0) {
      showToast("Add at least one daily time.", "error");
      return;
    }

    const oneOffDueAt =
      scheduleType === "one_off" && oneOffDate && oneOffTime
        ? new Date(`${oneOffDate}T${oneOffTime}:00`).toISOString()
        : undefined;

    try {
      await updateMedication.mutateAsync({
        medicationId: medication.id,
        name: trimmedName,
        dose: normalizedDose,
        route,
        instructions,
        scheduleType,
        dailyTimes,
        oneOffDueAt,
        expiresAt: expiresAt.trim() || undefined,
        stockQuantity: stockQtyVal,
        stockUnit: stockUnit.trim(),
        lowStockThreshold: lowThresholdVal,
      });
      showToast("Medication updated.", "success");
      setIsEditing(false);
    } catch (e: any) {
      showToast(e?.message ?? "Could not update medication.", "error");
    }
  };

  const onDelete = async () => {
    try {
      await deleteMedication.mutateAsync(medication.id);
      showToast("Medication deleted.", "success");
      setConfirmDelete(false);
      onClose();
    } catch (e: any) {
      showToast(e?.message ?? "Could not delete medication.", "error");
    }
  };

  const onQuickRefill = async () => {
    if (!canEdit) return;
    if (!canSubmitRefill) {
      showToast("Enter a valid refill amount greater than 0.", "error");
      return;
    }

    try {
      await updateMedication.mutateAsync({
        medicationId: medication.id,
        name: medication.name,
        dose: medication.dose ?? undefined,
        route: medication.route,
        instructions: medication.instructions ?? undefined,
        scheduleType: medication.schedule_type,
        dailyTimes: medication.schedule_times,
        oneOffDueAt: medication.one_off_due_at ?? undefined,
        expiresAt: medication.expires_at ?? undefined,
        stockQuantity: refillTargetQty,
        stockUnit: medication.stock_unit ?? undefined,
        lowStockThreshold: medication.low_stock_threshold ?? undefined,
      });
      showToast("Stock refilled.", "success");
      setRefillAmount("");
    } catch (e: any) {
      showToast(e?.message ?? "Could not refill stock.", "error");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 16 + Math.max(insets.bottom, 8) }]}
          onPress={() => {}}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 8) }}
          >
            <AppText weight="bold" style={styles.title}>
              {medication.name}
            </AppText>
            <AppText style={styles.subtitle}>{isEditing ? "Edit medication details" : "Medication details"}</AppText>

            {!isEditing ? (
              <>
                <View style={styles.card}>
                  <Row label="Dose" value={medication.dose ?? "Not set"} />
                  <Row label="Route" value={formatRoute(medication.route)} />
                  <Row label="Schedule" value={formatSchedule(medication)} />
                  <Row label="Expires at" value={medication.expires_at ?? "Not set"} />
                  <Row label="Instructions" value={medication.instructions ?? "None"} />
                </View>

                <View style={styles.card}>
                  <Row
                    label="Current stock"
                    value={
                      medication.stock_quantity == null
                        ? "Not set"
                        : `${medication.stock_quantity}${medication.stock_unit ? ` ${medication.stock_unit}` : ""}`
                    }
                  />
                  <Row
                    label="Low-stock threshold"
                    value={
                      medication.low_stock_threshold == null
                        ? "Not set"
                        : `${medication.low_stock_threshold}${medication.stock_unit ? ` ${medication.stock_unit}` : ""}`
                    }
                  />
                  {stockProgress ? (
                    <View style={styles.progressWrap}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            stockProgress.isDanger
                              ? styles.progressFillDanger
                              : styles.progressFillSafe,
                            { width: `${stockProgress.fillPercent}%` },
                          ]}
                        />
                      </View>
                      <AppText style={styles.progressLabel}>
                        {stockProgress.labelPercent}% of low-stock threshold
                      </AppText>
                    </View>
                  ) : (
                    <AppText style={styles.helperText}>
                      Add current stock and low-stock threshold to see progress.
                    </AppText>
                  )}

                  <AppText
                    style={[
                      styles.stockStatus,
                      stockState.tone === "danger"
                        ? styles.stockDanger
                        : stockState.tone === "warn"
                          ? styles.stockWarn
                          : stockState.tone === "good"
                            ? styles.stockGood
                            : styles.stockNeutral,
                    ]}
                  >
                    {stockState.label}
                  </AppText>
                  <AppText style={styles.runoutText}>{runoutEstimate}</AppText>

                  {canEdit ? (
                    <View style={styles.quickRefillWrap}>
                      <AppText style={styles.fieldLabel}>Quick refill</AppText>
                      <TextInput
                        value={refillAmount}
                        onChangeText={(t) => setRefillAmount(sanitizeDecimalInput(t))}
                        keyboardType="decimal-pad"
                        placeholder="Add amount (e.g. 100)"
                        style={styles.input}
                      />
                      <AppText style={styles.helperText}>
                        New total:{" "}
                        {canSubmitRefill
                          ? `${refillTargetQty}${medication.stock_unit ? ` ${medication.stock_unit}` : ""}`
                          : `${refillBaseQty}${medication.stock_unit ? ` ${medication.stock_unit}` : ""}`}
                      </AppText>
                      <Pressable
                        style={[
                          styles.primaryBtn,
                          (!canSubmitRefill || updateMedication.isPending) &&
                            styles.disabledBtn,
                        ]}
                        disabled={!canSubmitRefill || updateMedication.isPending}
                        onPress={onQuickRefill}
                      >
                        {updateMedication.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <AppText style={styles.primaryBtnText}>Apply Refill</AppText>
                        )}
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </>
            ) : (
              <View style={styles.card}>
                <Field label="Name">
                  <TextInput value={name} onChangeText={setName} style={styles.input} />
                </Field>

                <Field label="Dose">
                  <View style={styles.inlineRow}>
                    <TextInput
                      value={doseQty}
                      onChangeText={(t) => setDoseQty(sanitizeDecimalInput(t))}
                      keyboardType="decimal-pad"
                      placeholder="Qty"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <Pressable
                      style={[styles.input, styles.unitBtn]}
                      onPress={() => setShowDoseUnits((v) => !v)}
                    >
                      <AppText>{doseUnit}</AppText>
                    </Pressable>
                  </View>
                  {showDoseUnits ? (
                    <Dropdown
                      options={UNIT_OPTIONS}
                      selected={doseUnit}
                      onSelect={(v) => {
                        setDoseUnit(v);
                        setShowDoseUnits(false);
                      }}
                    />
                  ) : null}
                </Field>

                <Field label="Route">
                  <Pressable style={styles.input} onPress={() => setShowRouteOptions((v) => !v)}>
                    <AppText>{formatRoute(route)}</AppText>
                  </Pressable>
                  {showRouteOptions ? (
                    <Dropdown
                      options={[...ROUTE_OPTIONS]}
                      selected={route}
                      onSelect={(v) => {
                        setRoute(v as RouteOption);
                        setShowRouteOptions(false);
                      }}
                    />
                  ) : null}
                </Field>

                <Field label="Schedule type">
                  <View style={styles.inlineRow}>
                    {(["as_needed", "daily_same_time", "one_off"] as ScheduleType[]).map((v) => (
                      <Pressable
                        key={v}
                        style={[styles.chip, scheduleType === v && styles.chipActive]}
                        onPress={() => setScheduleType(v)}
                      >
                        <AppText
                          style={[styles.chipText, scheduleType === v && styles.chipTextActive]}
                        >
                          {v === "as_needed" ? "As needed" : v === "daily_same_time" ? "Daily" : "One-off"}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                </Field>

                {scheduleType === "daily_same_time" ? (
                  <Field label="Daily times (comma-separated HH:MM)">
                    <TextInput
                      value={dailyTimesCsv}
                      onChangeText={setDailyTimesCsv}
                      placeholder="07:00, 19:00"
                      style={styles.input}
                    />
                  </Field>
                ) : null}

                {scheduleType === "one_off" ? (
                  <>
                    <Field label="One-off date (YYYY-MM-DD)">
                      <TextInput
                        value={oneOffDate}
                        onChangeText={setOneOffDate}
                        placeholder="2026-03-07"
                        style={styles.input}
                      />
                    </Field>
                    <Field label="One-off time (HH:MM)">
                      <TextInput
                        value={oneOffTime}
                        onChangeText={setOneOffTime}
                        placeholder="14:00"
                        style={styles.input}
                      />
                    </Field>
                  </>
                ) : null}

                <Field label="Expires at (YYYY-MM-DD)">
                  <TextInput
                    value={expiresAt}
                    onChangeText={setExpiresAt}
                    placeholder="2027-12-31"
                    style={styles.input}
                  />
                </Field>

                <Field label="Current stock">
                  <View style={styles.inlineRow}>
                    <TextInput
                        value={stockQty}
                        onChangeText={(t) => setStockQty(sanitizeDecimalInput(t))}
                        keyboardType="decimal-pad"
                      placeholder="Qty"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <Pressable
                      style={[styles.input, styles.unitBtn]}
                      onPress={() => setShowStockUnits((v) => !v)}
                    >
                      <AppText>{stockUnit}</AppText>
                    </Pressable>
                  </View>
                  {showStockUnits ? (
                    <Dropdown
                      options={UNIT_OPTIONS}
                      selected={stockUnit}
                      onSelect={(v) => {
                        setStockUnit(v);
                        setShowStockUnits(false);
                      }}
                    />
                  ) : null}
                </Field>

                <Field label="Low-stock threshold">
                  <TextInput
                    value={lowThreshold}
                    onChangeText={(t) => setLowThreshold(sanitizeDecimalInput(t))}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 100"
                    style={styles.input}
                  />
                </Field>

                <Field label="Instructions">
                  <TextInput
                    value={instructions}
                    onChangeText={setInstructions}
                    placeholder="Optional notes"
                    style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
                    multiline
                  />
                </Field>
              </View>
            )}

            {confirmDelete ? (
              <View />
            ) : null}

            <View style={styles.actionRow}>
              {isEditing ? (
                <>
                  <Pressable style={styles.secondaryBtn} onPress={() => setIsEditing(false)}>
                    <AppText>Cancel</AppText>
                  </Pressable>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={onSave}
                    disabled={updateMedication.isPending}
                  >
                    {updateMedication.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <AppText style={styles.primaryBtnText}>Save changes</AppText>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable style={styles.secondaryBtn} onPress={onClose}>
                    <AppText>Close</AppText>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, !canEdit && styles.disabledBtn]}
                    onPress={() => setIsEditing(true)}
                    disabled={!canEdit}
                  >
                    <AppText style={[styles.primaryBtnText, !canEdit && styles.disabledBtnText]}>
                      Edit
                    </AppText>
                  </Pressable>
                </>
              )}
            </View>

            {!isEditing ? (
              <Pressable
                style={[styles.deleteGhostBtn, !canEdit && styles.disabledBtn]}
                onPress={() => setConfirmDelete(true)}
                disabled={!canEdit}
              >
                <AppText style={[styles.deleteGhostText, !canEdit && styles.disabledDeleteText]}>
                  Delete Medication
                </AppText>
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>

      <Modal
        visible={confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(false)}
      >
        <Pressable style={styles.confirmBackdrop} onPress={() => setConfirmDelete(false)}>
          <Pressable style={styles.confirmCard} onPress={() => {}}>
            <AppText weight="bold" style={styles.confirmTitle}>
              Delete medication?
            </AppText>
            <AppText style={styles.deleteConfirmText}>
              This will remove the medication and related schedule entries.
            </AppText>

            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => setConfirmDelete(false)}>
                <AppText>Cancel</AppText>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={onDelete}
                disabled={deleteMedication.isPending}
              >
                {deleteMedication.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <AppText style={styles.deleteBtnText}>Yes, delete</AppText>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 5 }}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      {children}
    </View>
  );
}

function Dropdown({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.dropdown}>
      <ScrollView nestedScrollEnabled style={{ maxHeight: 140 }}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              style={[styles.dropdownRow, active && styles.dropdownRowActive]}
              onPress={() => onSelect(option)}
            >
              <AppText style={active ? styles.dropdownTextActive : styles.dropdownText}>
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText style={styles.rowValue}>{value}</AppText>
    </View>
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
  title: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  card: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: "rgba(234,243,251,0.58)",
  },
  row: { gap: 2 },
  rowLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  rowValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  progressWrap: { marginTop: 4, gap: 4 },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(31,45,61,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4A90E2",
  },
  progressFillDanger: {
    backgroundColor: "#C53030",
  },
  progressFillSafe: {
    backgroundColor: "#2F855A",
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  stockStatus: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
  },
  stockDanger: { color: "#C53030" },
  stockWarn: { color: "#B7791F" },
  stockGood: { color: "#2F855A" },
  stockNeutral: { color: theme.colors.text.secondary },
  runoutText: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.15)",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: theme.colors.text.primary,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 8,
  },
  unitBtn: {
    width: 110,
    justifyContent: "center",
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.15)",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  dropdownRow: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(31,45,61,0.1)",
  },
  dropdownRowActive: {
    backgroundColor: "rgba(74,144,226,0.14)",
  },
  dropdownText: { color: theme.colors.text.primary },
  dropdownTextActive: { color: theme.colors.brand.dark },
  chip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.15)",
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "rgba(74,144,226,0.14)",
    borderColor: "rgba(74,144,226,0.25)",
  },
  chipText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  chipTextActive: {
    color: theme.colors.brand.dark,
  },
  actionRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31,45,61,0.2)",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "600" },
  disabledBtn: {
    opacity: 0.45,
  },
  disabledBtnText: {
    color: "rgba(255,255,255,0.95)",
  },
  deleteGhostBtn: {
    marginTop: 8,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(197,48,48,0.22)",
    backgroundColor: "rgba(197,48,48,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteGhostText: {
    color: "#C53030",
    fontWeight: "600",
  },
  disabledDeleteText: {
    color: "rgba(197,48,48,0.85)",
  },
  quickRefillWrap: {
    marginTop: 6,
    gap: 8,
  },
  quickRefillInputDisabled: {
    opacity: 0.55,
  },
  quickRefillCapacityToggle: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.18)",
    backgroundColor: "rgba(74,144,226,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quickRefillCapacityToggleActive: {
    borderColor: "rgba(74,144,226,0.30)",
    backgroundColor: "rgba(74,144,226,0.16)",
  },
  quickRefillCapacityText: {
    color: theme.colors.brand.dark,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  quickRefillCapacityTextActive: {
    fontWeight: "700",
  },
  deleteConfirm: {
    marginTop: 12,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "rgba(197,48,48,0.08)",
    borderWidth: 1,
    borderColor: "rgba(197,48,48,0.2)",
  },
  deleteConfirmText: {
    color: "#8B1D1D",
  },
  deleteBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#C53030",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: "white",
    fontWeight: "600",
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 14,
  },
  confirmTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
});
