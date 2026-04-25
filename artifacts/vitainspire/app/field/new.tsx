import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { Button } from "@/components/Button";
import { LocationPicker } from "@/components/LocationPicker";
import { useColors } from "@/hooks/useColors";
import { useStore, type Irrigation } from "@/hooks/useStore";
import { usePreciseLocation, formatLatLon } from "@/hooks/usePreciseLocation";
import { makeFieldId } from "@/utils/idGenerator";
import { syncFieldToSheet } from "@/utils/sheetSync";
import { INDIA_STATES, findState, findDistrict } from "@/data/indiaLocations";

const CROPS = ["Maize", "Sorghum", "Bajra", "Wheat", "Rice", "Other"];
const IRRIGATION_OPTIONS: Irrigation[] = ["Rainfed", "Irrigated", "Mixed"];

const STEPS = [
  { question: "Where is\nthis field?",      optional: false },
  { question: "What crop\nis growing here?", optional: false },
  { question: "How big is\nthe field?",      optional: true  },
  { question: "When was\nit sown?",          optional: true  },
  { question: "Any other\nfield details?",   optional: true  },
];

function toDateString(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDisplay(iso: string) {
  if (!iso) return null;
  const [y, m, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[parseInt(m) - 1]} ${y}`;
}

export default function NewFieldScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addField, getNextNumericId, farmer } = useStore();
  const { gps, status: gpsStatus, start: startGps } = usePreciseLocation();

  const [stateCode, setStateCode] = useState("AP");
  const [districtCode, setDistrictCode] = useState(() => {
    const ap = findState("AP");
    return ap?.districts.find((d) => d.name === "Kurnool")?.code ?? ap?.districts[0]?.code ?? "ATP";
  });
  const [crop, setCrop] = useState("");
  const [area, setArea] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [expectedHarvest, setExpectedHarvest] = useState("");
  const [irrigation, setIrrigation] = useState<Irrigation>("");
  const [plantHeight, setPlantHeight] = useState("");
  const [rowSpacing, setRowSpacing] = useState("");
  const [plantSpacing, setPlantSpacing] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Date picker state
  const [datePicking, setDatePicking] = useState<"sowing" | "harvest" | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const [step, setStep] = useState(0);
  const directionRef = useRef<"fwd" | "bk">("fwd");
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { startGps(); }, [startGps]);

  const stateObj = findState(stateCode) ?? INDIA_STATES[0];
  const districtObj = findDistrict(stateCode, districtCode) ?? stateObj.districts[0];

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;
  const isFirstStep = step === 0;
  const isLastStep = step === STEPS.length - 1;

  const advance = () => {
    directionRef.current = "fwd";
    setStep((s) => s + 1);
  };

  const goNext = () => {
    directionRef.current = "fwd";
    if (isLastStep) { save(); return; }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (isFirstStep) { router.back(); return; }
    directionRef.current = "bk";
    setStep((s) => s - 1);
  };

  const scheduleAdvance = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => advance(), 350);
  };

  const openDatePicker = (field: "sowing" | "harvest") => {
    const existing = field === "sowing" ? sowingDate : expectedHarvest;
    setTempDate(existing ? new Date(existing) : new Date());
    setDatePicking(field);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const confirmDate = () => {
    if (datePicking === "sowing") setSowingDate(toDateString(tempDate));
    else if (datePicking === "harvest") setExpectedHarvest(toDateString(tempDate));
    setDatePicking(null);
  };

  const save = async () => {
    if (!crop) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const numericId = getNextNumericId();
    const id = makeFieldId(stateCode, districtObj.code, numericId);
    const now = new Date().toISOString();
    const newField = {
      id, numericId,
      state: stateCode, stateName: stateObj.name,
      district: districtObj.code, districtName: districtObj.name,
      cropType: crop,
      cropDetails: {
        variety: "", sowingDate, expectedHarvestDate: expectedHarvest,
        irrigation, plantHeightCm: plantHeight, rowSpacingCm: rowSpacing,
        plantSpacingCm: plantSpacing, notes: "",
      },
      area,
      gps: gps ? { latitude: gps.latitude, longitude: gps.longitude, accuracy: gps.accuracy, altitude: gps.altitude, capturedAt: gps.capturedAt } : null,
      createdAt: now,
      createdBy: farmer?.name ?? "Unknown",
      status: "standing" as const,
      standing: { plantUri: null, leafCobUri: null, capturedAt: now, capturedBy: farmer?.name ?? "Unknown" },
      cut: null, cutData: null, chopped: null, choppedData: null,
      fieldVisit: null, silage: null,
    };
    await addField(newField);
    syncFieldToSheet(newField);
    router.replace(`/field/zone-sampling?fieldId=${id}`);
  };

  const renderInputs = () => {
    switch (step) {
      case 0:
        return (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPickerOpen(true); }}
              activeOpacity={0.85}
              style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputTitle, { color: colors.foreground }]}>{stateObj.name} · {districtObj.name}</Text>
                <Text style={[styles.inputSub, { color: colors.mutedForeground }]}>Tap to change state or district</Text>
              </View>
              <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputTitle, { color: colors.foreground }]}>
                  {gps ? formatLatLon(gps) : gpsStatus === "requesting" ? "Locating…" : "GPS unavailable"}
                </Text>
                {gps && (
                  <Text style={[styles.inputSub, { color: colors.mutedForeground }]}>
                    ±{Math.round(gps.accuracy ?? 0)} m{gps.altitude != null ? ` · alt ${Math.round(gps.altitude)} m` : ""}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={startGps} style={[styles.refreshBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
                <Feather name="refresh-cw" size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.pillWrap}>
            {CROPS.map((c) => (
              <Pill
                key={c}
                label={c}
                selected={crop === c}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCrop(c);
                  scheduleAdvance();
                }}
                colors={colors}
                large
              />
            ))}
          </View>
        );

      case 2:
        return (
          <View style={{ gap: 12 }}>
            <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="edit-2" size={16} color={colors.primary} />
              </View>
              <TextInput
                value={area}
                onChangeText={setArea}
                placeholder="e.g. 2.5 acres"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                style={[styles.areaInput, { color: colors.foreground }]}
              />
            </View>
            <TouchableOpacity
              onPress={() => router.push("/field/walker")}
              activeOpacity={0.85}
              style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="walk" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputTitle, { color: colors.foreground }]}>Walk the perimeter</Text>
                <Text style={[styles.inputSub, { color: colors.mutedForeground }]}>Calculates area automatically</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={{ gap: 14 }}>
            <DateField
              label="Sowing date"
              value={sowingDate}
              onPress={() => openDatePicker("sowing")}
              colors={colors}
            />
            <DateField
              label="Expected harvest"
              value={expectedHarvest}
              onPress={() => openDatePicker("harvest")}
              colors={colors}
            />
          </View>
        );

      case 4:
        return (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>Irrigation</Text>
              <View style={styles.pillWrap}>
                {IRRIGATION_OPTIONS.map((o) => (
                  <Pill
                    key={o}
                    label={o}
                    selected={irrigation === o}
                    onPress={() => { Haptics.selectionAsync(); setIrrigation(irrigation === o ? "" : o); }}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <MiniField label="Plant ht (cm)" value={plantHeight} onChange={setPlantHeight} placeholder="220" numeric colors={colors} />
              <MiniField label="Row sp (cm)" value={rowSpacing} onChange={setRowSpacing} placeholder="60" numeric colors={colors} />
              <MiniField label="Plant sp (cm)" value={plantSpacing} onChange={setPlantSpacing} placeholder="20" numeric colors={colors} />
            </View>
          </View>
        );
    }
  };

  const isFwd = directionRef.current === "fwd";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goBack} style={[styles.iconBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
          <Feather name={isFirstStep ? "x" : "arrow-left"} size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((step + 1) / STEPS.length) * 100}%` as any }]} />
        </View>
        <Text style={[styles.stepCount, { color: colors.mutedForeground }]}>{step + 1} / {STEPS.length}</Text>
      </View>

      {/* Sliding step content */}
      <View style={{ flex: 1, overflow: "hidden" }}>
        <Animated.View
          key={step}
          entering={isFwd ? SlideInRight.duration(340) : SlideInLeft.duration(340)}
          exiting={isFwd ? SlideOutLeft.duration(340) : SlideOutRight.duration(340)}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[styles.stepContent, { paddingBottom: insets.bottom + 120 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {STEPS[step].optional && (
              <View style={[styles.optBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.optBadgeText, { color: colors.mutedForeground }]}>Optional — tap Skip to continue</Text>
              </View>
            )}

            <Text style={[styles.question, { color: colors.foreground }]}>
              {STEPS[step].question}
            </Text>

            <Animated.View entering={FadeInDown.delay(60).duration(320)} style={{ marginTop: 36 }}>
              {renderInputs()}
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {isLastStep ? (
          <Button
            title="Save & Start Zone Sampling"
            onPress={save}
            disabled={!crop || saving}
            loading={saving}
            icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          />
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            {STEPS[step].optional && (
              <TouchableOpacity
                onPress={goNext}
                activeOpacity={0.7}
                style={[styles.skipBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
              >
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
              </TouchableOpacity>
            )}
            <Button
              title="Next"
              onPress={goNext}
              disabled={step === 1 && !crop}
              icon={<Feather name="arrow-right" size={18} color={colors.primaryForeground} />}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>

      {/* Location picker modal */}
      <LocationPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedState={stateCode}
        selectedDistrict={districtCode}
        onSelect={(s, d) => { setStateCode(s.code); setDistrictCode(d.code); }}
      />

      {/* Date picker modal */}
      {datePicking !== null && (
        <DatePickerModal
          date={tempDate}
          colors={colors}
          insets={insets}
          label={datePicking === "sowing" ? "Sowing Date" : "Expected Harvest"}
          onChange={(d) => setTempDate(d)}
          onConfirm={confirmDate}
          onCancel={() => setDatePicking(null)}
        />
      )}
    </View>
  );
}

// ── Date picker modal ─────────────────────────────────────────────────────────

function DatePickerModal({
  date, colors, insets, label, onChange, onConfirm, onCancel,
}: {
  date: Date; colors: any; insets: any; label: string;
  onChange: (d: Date) => void; onConfirm: () => void; onCancel: () => void;
}) {
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const selectDay = (day: number) => {
    const picked = new Date(viewYear, viewMonth, day);
    onChange(picked);
    Haptics.selectionAsync();
  };

  const isSelected = (day: number) =>
    date.getFullYear() === viewYear && date.getMonth() === viewMonth && date.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onCancel} activeOpacity={1} />
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={{ fontSize: 13, fontWeight: "800", color: colors.foreground }}>{label}</Text>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={[styles.calCloseBtn, { backgroundColor: colors.secondary }]}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Month nav */}
          <View style={styles.calMonthRow}>
            <TouchableOpacity onPress={prevMonth} style={[styles.calNavBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
              <Feather name="chevron-left" size={15} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.calMonthLabel, { color: colors.foreground }]}>
              {MONTHS[viewMonth].slice(0, 3)} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={[styles.calNavBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
              <Feather name="chevron-right" size={15} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={styles.calDayLabels}>
            {DAY_LABELS.map(d => (
              <Text key={d} style={[styles.calDayLabel, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.calGrid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e${i}`} style={styles.calCell} />;
              const sel = isSelected(day);
              const tod = isToday(day);
              return (
                <TouchableOpacity
                  key={`d${day}`}
                  onPress={() => { selectDay(day); setTimeout(onConfirm, 120); }}
                  activeOpacity={0.75}
                  style={[
                    styles.calCell,
                    sel && { backgroundColor: colors.primary, borderRadius: 999 },
                    !sel && tod && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 999 },
                  ]}
                >
                  <Text style={{
                    fontSize: 12, fontWeight: sel ? "800" : "500",
                    color: sel ? colors.primaryForeground : tod ? colors.primary : colors.foreground,
                  }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── DateField ─────────────────────────────────────────────────────────────────

function DateField({ label, value, onPress, colors }: {
  label: string; value: string; onPress: () => void; colors: any;
}) {
  const display = formatDisplay(value);
  return (
    <View>
      <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.dateField, {
          backgroundColor: colors.card,
          borderColor: value ? colors.primary : colors.border,
          borderRadius: colors.radius,
        }]}
      >
        <Feather name="calendar" size={18} color={value ? colors.primary : colors.mutedForeground} />
        <Text style={[styles.dateFieldText, { color: value ? colors.foreground : colors.mutedForeground }]}>
          {display ?? "Tap to select date"}
        </Text>
        {value && <Feather name="check-circle" size={16} color={colors.primary} />}
      </TouchableOpacity>
    </View>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────────

function Pill({ label, selected, onPress, colors, large }: {
  label: string; selected: boolean; onPress: () => void; colors: any; large?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingHorizontal: large ? 20 : 16,
        paddingVertical: large ? 13 : 10,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.card,
      }}
    >
      <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontWeight: "700", fontSize: large ? 15 : 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── MiniField ─────────────────────────────────────────────────────────────────

function MiniField({ label, value, onChange, placeholder, numeric, colors }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; numeric?: boolean; colors: any;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={numeric ? "decimal-pad" : "default"}
        style={[styles.miniInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  stepCount: { fontSize: 12, fontWeight: "700", minWidth: 36, textAlign: "right" },
  stepContent: { paddingHorizontal: 24, paddingTop: 32, gap: 0 },
  optBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 20 },
  optBadgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  question: { fontSize: 36, fontWeight: "900", lineHeight: 44, letterSpacing: -1 },
  inputCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 1 },
  inputIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  inputTitle: { fontSize: 15, fontWeight: "700" },
  inputSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  refreshBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  areaInput: { fontSize: 16, fontWeight: "600", paddingVertical: 4, flex: 1 },
  miniLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  miniInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontWeight: "600" },
  dateField: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 1.5 },
  dateFieldText: { flex: 1, fontSize: 15, fontWeight: "600" },
  bottomBar: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, gap: 8 },
  skipBtn: { paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  skipText: { fontSize: 14, fontWeight: "700" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { width: 300, borderRadius: 18, padding: 14, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  modalHandle: { width: 0, height: 0 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  calCloseBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  calMonthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  calNavBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  calMonthLabel: { fontSize: 13, fontWeight: "800" },
  calDayLabels: { flexDirection: "row", marginBottom: 4 },
  calDayLabel: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: "14.285714%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
});
