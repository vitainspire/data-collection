import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import {
  useStore,
  type FieldVisit,
  type ZoneData,
  type CutObservation,
  type ChoppedObservation,
} from "@/hooks/useStore";
import { Button } from "@/components/Button";
import { CapturePhotoCard } from "@/components/CapturePhotoCard";
import { LocationPicker } from "@/components/LocationPicker";
import { SegmentedControl } from "@/components/SegmentedControl";
import { StatusChecklist } from "@/components/StatusChecklist";
import { type StateEntry, type DistrictEntry } from "@/data/indiaLocations";

const CROP_TYPES = ["Maize", "Rice", "Wheat", "Sugarcane", "Cotton"] as const;

async function pickPhoto(): Promise<string | null> {
  if (Platform.OS === "web") {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    return r.canceled ? null : r.assets[0].uri;
  }
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== "granted") {
    Alert.alert("Camera permission", "Please allow camera access to take photos.");
    return null;
  }
  const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  return r.canceled ? null : r.assets[0].uri;
}

const EMPTY_ZONE: ZoneData = {
  plantUri: null,
  cobUri: null,
  plantHeight: "",
  plantColor: "",
  standDensity: "",
};

const EMPTY_CUT_OBS: CutObservation = {
  yieldEstimate: "",
  moistureAtCut: "",
  stubbleHeight: "",
  savedAt: "",
};

const EMPTY_CHOPPED_OBS: ChoppedObservation = {
  chopLength: "",
  uniformity: "",
  materialQuality: "",
  savedAt: "",
};

function emptyVisit(): FieldVisit {
  return {
    visitId: "",
    createdAt: new Date().toISOString(),
    state: "",
    stateName: "",
    district: "",
    districtName: "",
    areaAcres: "",
    cropType: "",
    zones: { A: { ...EMPTY_ZONE }, B: { ...EMPTY_ZONE }, C: { ...EMPTY_ZONE } },
    fieldHealth: { plantStand: "", pestPressure: "", diseaseSeen: "", rainfallPattern: "" },
    fieldPhotos: { overview: null, leaf: null, cob: null },
    savedAt: "",
  };
}

function generateVisitId(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `V-${d}-${r}`;
}

export default function HarvestTab() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fields, updateField, refresh } = useStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Cut observations
  const [cutObs, setCutObs] = useState<CutObservation>({ ...EMPTY_CUT_OBS });
  const [cutSaved, setCutSaved] = useState(false);

  // Chopped observations
  const [choppedObs, setChoppedObs] = useState<ChoppedObservation>({ ...EMPTY_CHOPPED_OBS });
  const [choppedSaved, setChoppedSaved] = useState(false);

  // Field visit
  const [visit, setVisit] = useState<FieldVisit>(emptyVisit());
  const [locationVisible, setLocationVisible] = useState(false);
  const [visitSaved, setVisitSaved] = useState(false);

  // Harvest zone sampling
  const [activeHarvestZone, setActiveHarvestZone] = useState<"A" | "B" | "C">("A");

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const eligibleFields = fields.filter((f) => f.standing.plantUri);
  const selected = eligibleFields.find((f) => f.id === selectedId) ?? null;

  const selectField = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(id);
    const f = fields.find((x) => x.id === id);

    // Sync cut observations
    if (f?.cutData) {
      setCutObs(f.cutData);
      setCutSaved(true);
    } else {
      setCutObs({ ...EMPTY_CUT_OBS });
      setCutSaved(false);
    }

    // Sync chopped observations
    if (f?.choppedData) {
      setChoppedObs(f.choppedData);
      setChoppedSaved(true);
    } else {
      setChoppedObs({ ...EMPTY_CHOPPED_OBS });
      setChoppedSaved(false);
    }

    // Sync field visit
    if (f?.fieldVisit) {
      setVisit(f.fieldVisit);
      setVisitSaved(true);
    } else {
      const v = emptyVisit();
      if (f) {
        v.state = f.state;
        v.stateName = f.stateName;
        v.district = f.district;
        v.districtName = f.districtName;
        v.areaAcres = f.area;
        v.cropType = f.cropType;
      }
      setVisit(v);
      setVisitSaved(false);
    }
  };

  const captureCut = async () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const uri = await pickPhoto();
    if (!uri) return;
    await updateField(selected.id, {
      cut: { uri, capturedAt: new Date().toISOString() },
      status: selected.status === "standing" ? "cut" : selected.status,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const captureChopped = async () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const uri = await pickPhoto();
    if (!uri) return;
    await updateField(selected.id, {
      chopped: { uri, capturedAt: new Date().toISOString() },
      status: "chopped",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveCutData = async () => {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data: CutObservation = { ...cutObs, savedAt: new Date().toISOString() };
    await updateField(selected.id, { cutData: data });
    setCutObs(data);
    setCutSaved(true);
  };

  const saveChoppedData = async () => {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data: ChoppedObservation = { ...choppedObs, savedAt: new Date().toISOString() };
    await updateField(selected.id, { choppedData: data });
    setChoppedObs(data);
    setChoppedSaved(true);
  };

  const updateHarvestZone = (key: "A" | "B" | "C", patch: Partial<ZoneData>) => {
    setVisit((v) => ({ ...v, zones: { ...v.zones, [key]: { ...v.zones[key], ...patch } } }));
    setVisitSaved(false);
  };

  const updateHealth = (key: keyof FieldVisit["fieldHealth"], value: string) => {
    setVisit((v) => ({ ...v, fieldHealth: { ...v.fieldHealth, [key]: value } }));
  };

  const saveVisit = async () => {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data: FieldVisit = {
      ...visit,
      visitId: visit.visitId || generateVisitId(),
      savedAt: new Date().toISOString(),
    };
    await updateField(selected.id, { fieldVisit: data });
    setVisit(data);
    setVisitSaved(true);
  };

  const bottomPad = Platform.OS === "web" ? 110 : 100;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: 16, paddingBottom: bottomPad },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace("/home"); }}
          activeOpacity={0.7}
          style={[styles.backBtn, { backgroundColor: colors.secondary }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.h1, { color: colors.foreground }]}>Harvest</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Continue the field journey and record visit data.
          </Text>
        </View>
      </View>

      {/* ── STEP 1: SELECT FIELD ── */}
      <StepHeader num="1" label="Select Field" colors={colors} />

      {eligibleFields.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="leaf-off" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No fields ready</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Create a field in Field Capture first
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
          {eligibleFields.map((f) => {
            const isSel = f.id === selectedId;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => selectField(f.id)}
                activeOpacity={0.85}
                style={[
                  styles.fieldChip,
                  {
                    backgroundColor: isSel ? colors.primary : colors.card,
                    borderColor: isSel ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={{ color: isSel ? colors.primaryForeground : colors.foreground, fontWeight: "800", fontSize: 14, letterSpacing: 0.3 }}>
                  {f.id}
                </Text>
                <Text style={{ color: isSel ? colors.primaryForeground : colors.mutedForeground, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                  {f.cropType}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selected && (
        <Animated.View entering={FadeIn.duration(250)}>

          {/* ── STEP 2: PROGRESS ── */}
          <StepHeader num="2" label="Progress" colors={colors} />
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.progressHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldId, { color: colors.foreground }]}>{selected.id}</Text>
                <Text style={[styles.fieldMeta, { color: colors.mutedForeground }]}>
                  {selected.cropType}{selected.area ? ` · ${selected.area} acres` : ""}
                </Text>
              </View>
              {selected.standing.plantUri && (
                <Image source={{ uri: selected.standing.plantUri }} style={styles.progressThumb} contentFit="cover" />
              )}
            </View>
            <StatusChecklist field={selected} />
          </View>

          {/* ── STEP 3: CAPTURE CUT ── */}
          <StepHeader num="3" label="Capture Cut" colors={colors} />
          <View style={[styles.stageCard, { backgroundColor: colors.card, borderColor: selected.cut ? colors.primary : colors.border, borderRadius: colors.radius }]}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageIcon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="content-cut" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stageTitle, { color: colors.foreground }]}>Cut Plant</Text>
                <Text style={[styles.stageSub, { color: colors.mutedForeground }]}>
                  {selected.cut ? `Captured ${new Date(selected.cut.capturedAt).toLocaleString()}` : "Photograph the freshly cut crop"}
                </Text>
              </View>
              {selected.cut && <DoneBadge colors={colors} />}
            </View>
            {selected.cut?.uri && <Image source={{ uri: selected.cut.uri }} style={styles.stageImg} contentFit="cover" />}
            <Button
              title={selected.cut ? "Retake Cut Photo" : "Capture Cut Plant"}
              variant={selected.cut ? "outline" : "primary"}
              icon={<Feather name="camera" size={18} color={selected.cut ? colors.primary : colors.primaryForeground} />}
              onPress={captureCut}
            />
          </View>

          {/* ── ZONE REFERENCE (standing data, shown after cut photo) ── */}
          {selected.cut && selected.zones && (
            <Animated.View entering={FadeIn.duration(200)}>
              <View style={[styles.zoneSummaryCard, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
                <View style={styles.zoneSummaryHeader}>
                  <MaterialCommunityIcons name="sprout" size={16} color={colors.primary} />
                  <Text style={[styles.zoneSummaryTitle, { color: colors.foreground }]}>Standing Zone Reference</Text>
                  <Text style={[styles.zoneSummaryHint, { color: colors.mutedForeground }]}>from Field Capture</Text>
                </View>
                <View style={styles.zoneSummaryRow}>
                  {(["A", "B", "C"] as const).map((z) => {
                    const zd = selected.zones![z];
                    const hasPhoto = !!zd.plantUri;
                    return (
                      <View key={z} style={[styles.zonePill, { backgroundColor: hasPhoto ? colors.primary + "18" : colors.card, borderColor: hasPhoto ? colors.primary : colors.border, borderRadius: 8 }]}>
                        {zd.plantUri && <Image source={{ uri: zd.plantUri }} style={styles.zoneThumb} contentFit="cover" />}
                        <Text style={[styles.zoneLabel, { color: colors.foreground }]}>Zone {z}</Text>
                        {zd.plantHeight ? <Text style={[styles.zoneMeta, { color: colors.mutedForeground }]}>{zd.plantHeight}</Text> : null}
                        {zd.plantColor ? <Text style={[styles.zoneMeta, { color: colors.mutedForeground }]}>{zd.plantColor}</Text> : null}
                        {zd.standDensity ? <Text style={[styles.zoneMeta, { color: colors.mutedForeground }]}>{zd.standDensity}</Text> : null}
                        {!hasPhoto && !zd.plantHeight && <Text style={[styles.zoneMeta, { color: colors.mutedForeground }]}>Not captured</Text>}
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── CUT OBSERVATIONS (shown after cut photo) ── */}
          {selected.cut && (
            <Animated.View entering={FadeIn.duration(200)}>
              <View style={[styles.obsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <View style={styles.obsCardHeader}>
                  <MaterialCommunityIcons name="clipboard-list-outline" size={18} color={colors.primary} />
                  <Text style={[styles.obsCardTitle, { color: colors.foreground }]}>Cut Observations</Text>
                </View>

                <Text style={[styles.label, { color: colors.foreground }]}>Yield Estimate</Text>
                <Text style={[styles.obsHint, { color: colors.mutedForeground }]}>Compared to expected standing yield</Text>
                <View style={styles.pillRow}>
                  {(["Low", "Medium", "High"] as const).map((o) => (
                    <OptionPill key={o} label={o} selected={cutObs.yieldEstimate === o} onPress={() => { setCutObs((c) => ({ ...c, yieldEstimate: o })); setCutSaved(false); }} colors={colors} />
                  ))}
                </View>

                <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Moisture at Cut</Text>
                <View style={styles.pillRow}>
                  {(["Dry", "Optimal", "Wet"] as const).map((o) => (
                    <OptionPill key={o} label={o} selected={cutObs.moistureAtCut === o} onPress={() => { setCutObs((c) => ({ ...c, moistureAtCut: o })); setCutSaved(false); }} colors={colors} />
                  ))}
                </View>

                <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Stubble Height</Text>
                <Text style={[styles.obsHint, { color: colors.mutedForeground }]}>Height of remaining stubble after cut</Text>
                <View style={styles.pillRow}>
                  {(["Low", "Medium", "High"] as const).map((o) => (
                    <OptionPill key={o} label={o} selected={cutObs.stubbleHeight === o} onPress={() => { setCutObs((c) => ({ ...c, stubbleHeight: o })); setCutSaved(false); }} colors={colors} />
                  ))}
                </View>

                {cutSaved ? (
                  <View style={[styles.savedBanner, { backgroundColor: colors.primary, borderRadius: colors.radius, marginTop: 14 }]}>
                    <Feather name="check-circle" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.savedText, { color: colors.primaryForeground }]}>Cut data saved</Text>
                    <TouchableOpacity onPress={() => setCutSaved(false)} hitSlop={8}>
                      <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 13, opacity: 0.8 }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Button
                    title="Save Cut Observations"
                    onPress={saveCutData}
                    icon={<Feather name="save" size={18} color={colors.primaryForeground} />}
                    style={{ marginTop: 14 }}
                  />
                )}
              </View>
            </Animated.View>
          )}

          {/* ── STEP 4: CAPTURE CHOPPED ── */}
          <StepHeader num="4" label="Capture Chopped" colors={colors} dim={!selected.cut} hint={!selected.cut ? "complete Cut first" : undefined} />
          <View style={[styles.stageCard, { backgroundColor: colors.card, borderColor: selected.chopped ? colors.primary : colors.border, borderRadius: colors.radius, opacity: selected.cut ? 1 : 0.45 }]}>
            <View style={styles.stageHeader}>
              <View style={[styles.stageIcon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="grain" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stageTitle, { color: colors.foreground }]}>Chopped Material</Text>
                <Text style={[styles.stageSub, { color: colors.mutedForeground }]}>
                  {selected.chopped ? `Captured ${new Date(selected.chopped.capturedAt).toLocaleString()}` : selected.cut ? "Photograph after chopping" : "Capture Cut Plant first"}
                </Text>
              </View>
              {selected.chopped && <DoneBadge colors={colors} />}
            </View>
            {selected.chopped?.uri && <Image source={{ uri: selected.chopped.uri }} style={styles.stageImg} contentFit="cover" />}
            <Button
              title={selected.chopped ? "Retake Chopped Photo" : "Capture Chopped Material"}
              variant={selected.chopped ? "outline" : "primary"}
              icon={<Feather name="camera" size={18} color={selected.chopped ? colors.primary : colors.primaryForeground} />}
              onPress={captureChopped}
              disabled={!selected.cut}
            />
          </View>

          {/* ── CHOPPED OBSERVATIONS (optional, shown after chopped photo) ── */}
          {selected.chopped && (
            <Animated.View entering={FadeIn.duration(200)}>
              <View style={[styles.obsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <View style={styles.obsCardHeader}>
                  <MaterialCommunityIcons name="clipboard-check-outline" size={18} color={colors.primary} />
                  <Text style={[styles.obsCardTitle, { color: colors.foreground }]}>Chopped Observations</Text>
                  <View style={[styles.optionalBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>optional</Text>
                  </View>
                </View>

                <Text style={[styles.label, { color: colors.foreground }]}>Chop Length</Text>
                <View style={styles.pillRow}>
                  {(["Fine", "Medium", "Coarse"] as const).map((o) => (
                    <OptionPill key={o} label={o} selected={choppedObs.chopLength === o} onPress={() => { setChoppedObs((c) => ({ ...c, chopLength: o })); setChoppedSaved(false); }} colors={colors} />
                  ))}
                </View>

                <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Uniformity</Text>
                <View style={styles.pillRow}>
                  {(["Uniform", "Mixed", "Uneven"] as const).map((o) => (
                    <OptionPill key={o} label={o} selected={choppedObs.uniformity === o} onPress={() => { setChoppedObs((c) => ({ ...c, uniformity: o })); setChoppedSaved(false); }} colors={colors} />
                  ))}
                </View>

                <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Material Quality</Text>
                <View style={styles.pillRow}>
                  {(["Good", "Fair", "Poor"] as const).map((o) => (
                    <OptionPill key={o} label={o} selected={choppedObs.materialQuality === o} onPress={() => { setChoppedObs((c) => ({ ...c, materialQuality: o })); setChoppedSaved(false); }} colors={colors} />
                  ))}
                </View>

                {choppedSaved ? (
                  <View style={[styles.savedBanner, { backgroundColor: colors.primary, borderRadius: colors.radius, marginTop: 14 }]}>
                    <Feather name="check-circle" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.savedText, { color: colors.primaryForeground }]}>Chopped data saved</Text>
                    <TouchableOpacity onPress={() => setChoppedSaved(false)} hitSlop={8}>
                      <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 13, opacity: 0.8 }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Button
                    title="Save Chopped Observations"
                    onPress={saveChoppedData}
                    variant="outline"
                    icon={<Feather name="save" size={18} color={colors.primary} />}
                    style={{ marginTop: 14 }}
                  />
                )}
              </View>
            </Animated.View>
          )}

          {/* ══════════════════════════════════════
              FIELD VISIT DATA
          ══════════════════════════════════════ */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.visitHeading, { color: colors.foreground }]}>Field Visit Data</Text>

          {/* ── LOCATION & BASICS ── */}
          <StepHeader num="5" label="Location & Basics" colors={colors} />

          <TouchableOpacity
            onPress={() => setLocationVisible(true)}
            activeOpacity={0.85}
            style={[styles.locationBtn, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              {visit.stateName ? (
                <>
                  <Text style={[styles.locPrimary, { color: colors.foreground }]}>{visit.stateName}</Text>
                  <Text style={[styles.locSecondary, { color: colors.mutedForeground }]}>{visit.districtName || "Select district"}</Text>
                </>
              ) : (
                <Text style={[styles.locPlaceholder, { color: colors.mutedForeground }]}>Select State & District</Text>
              )}
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Field Area (acres)</Text>
          <TextInput
            value={visit.areaAcres}
            onChangeText={(t) => setVisit((v) => ({ ...v, areaAcres: t }))}
            placeholder="e.g. 2.5"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          />

          <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Crop Type</Text>
          <View style={styles.pillRow}>
            {CROP_TYPES.map((c) => (
              <OptionPill key={c} label={c} selected={visit.cropType === c} onPress={() => setVisit((v) => ({ ...v, cropType: c }))} colors={colors} />
            ))}
          </View>

          {visit.visitId ? (
            <View style={[styles.visitIdRow, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
              <Text style={[styles.visitIdLabel, { color: colors.mutedForeground }]}>Visit ID</Text>
              <Text style={[styles.visitIdVal, { color: colors.foreground }]}>{visit.visitId}</Text>
              <Text style={[styles.visitIdLabel, { color: colors.mutedForeground }]}>
                {new Date(visit.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ) : null}

          {/* ── ZONE SAMPLING ── */}
          <StepHeader num="6" label="Zone Sampling" colors={colors} />
          <Text style={[styles.zoneSectionSub, { color: colors.mutedForeground }]}>
            Capture plant and cob photos per zone, and rate each zone at harvest time.
          </Text>

          <SegmentedControl
            options={[{ label: "Zone A", value: "A" }, { label: "Zone B", value: "B" }, { label: "Zone C", value: "C" }]}
            value={activeHarvestZone}
            onChange={(v) => setActiveHarvestZone(v as "A" | "B" | "C")}
          />

          <View style={[styles.zoneCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            {(() => {
              const hz = visit.zones[activeHarvestZone];
              return (
                <>
                  <CapturePhotoCard
                    label="Plant Photo"
                    hint={`Zone ${activeHarvestZone} — photograph the plant at harvest`}
                    uri={hz.plantUri}
                    onChange={(uri) => updateHarvestZone(activeHarvestZone, { plantUri: uri })}
                    height={160}
                  />

                  <Text style={[styles.label, { color: colors.foreground }]}>Plant Height</Text>
                  <View style={styles.pillRow}>
                    {(["Tall", "Medium", "Short"] as const).map((o) => (
                      <OptionPill key={o} label={o} selected={hz.plantHeight === o} onPress={() => updateHarvestZone(activeHarvestZone, { plantHeight: o })} colors={colors} />
                    ))}
                  </View>

                  <Text style={[styles.label, { color: colors.foreground, marginTop: 12 }]}>Plant Color</Text>
                  <View style={styles.pillRow}>
                    {(["Dark", "Medium", "Pale"] as const).map((o) => (
                      <OptionPill key={o} label={o} selected={hz.plantColor === o} onPress={() => updateHarvestZone(activeHarvestZone, { plantColor: o })} colors={colors} />
                    ))}
                  </View>

                  <Text style={[styles.label, { color: colors.foreground, marginTop: 12 }]}>Stand Density</Text>
                  <View style={styles.pillRow}>
                    {(["Dense", "Medium", "Sparse"] as const).map((o) => (
                      <OptionPill key={o} label={o} selected={hz.standDensity === o} onPress={() => updateHarvestZone(activeHarvestZone, { standDensity: o })} colors={colors} />
                    ))}
                  </View>
                </>
              );
            })()}
          </View>

          {/* ── OVERALL FIELD HEALTH ── */}
          <StepHeader num="7" label="Overall Field Health" colors={colors} />
          <View style={[styles.healthCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>Plant Stand</Text>
            <View style={styles.pillRow}>
              {(["Good", "Medium", "Poor"] as const).map((o) => (
                <OptionPill key={o} label={o} selected={visit.fieldHealth.plantStand === o} onPress={() => updateHealth("plantStand", o)} colors={colors} />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Pest Pressure</Text>
            <View style={styles.pillRow}>
              {(["None", "Mild", "Severe"] as const).map((o) => (
                <OptionPill key={o} label={o} selected={visit.fieldHealth.pestPressure === o} onPress={() => updateHealth("pestPressure", o)} colors={colors} />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Disease Seen</Text>
            <View style={styles.pillRow}>
              {(["Yes", "No"] as const).map((o) => (
                <OptionPill key={o} label={o} selected={visit.fieldHealth.diseaseSeen === o} onPress={() => updateHealth("diseaseSeen", o)} colors={colors} />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Rainfall Pattern</Text>
            <View style={styles.pillRow}>
              {(["Adequate", "Low", "Excess"] as const).map((o) => (
                <OptionPill key={o} label={o} selected={visit.fieldHealth.rainfallPattern === o} onPress={() => updateHealth("rainfallPattern", o)} colors={colors} />
              ))}
            </View>
          </View>

          {/* ── FIELD PHOTOS ── */}
          <StepHeader num="8" label="Field Photos" colors={colors} />
          <View style={[styles.photosCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <CapturePhotoCard label="Overview Photo" hint="Wide shot of the entire field" uri={visit.fieldPhotos.overview} onChange={(uri) => setVisit((v) => ({ ...v, fieldPhotos: { ...v.fieldPhotos, overview: uri } }))} optional height={150} />
            <CapturePhotoCard label="Leaf Photo" hint="Close-up of a representative leaf" uri={visit.fieldPhotos.leaf} onChange={(uri) => setVisit((v) => ({ ...v, fieldPhotos: { ...v.fieldPhotos, leaf: uri } }))} optional height={150} />
            <CapturePhotoCard label="Cob Photo" hint="Close-up of a representative cob" uri={visit.fieldPhotos.cob} onChange={(uri) => setVisit((v) => ({ ...v, fieldPhotos: { ...v.fieldPhotos, cob: uri } }))} optional height={150} />
          </View>

          {/* ── SAVE VISIT ── */}
          {visitSaved ? (
            <View style={[styles.savedBanner, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
              <Feather name="check-circle" size={20} color={colors.primaryForeground} />
              <Text style={[styles.savedText, { color: colors.primaryForeground }]}>
                Visit saved — {visit.visitId}
              </Text>
              <TouchableOpacity onPress={() => setVisitSaved(false)} hitSlop={8}>
                <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 13, opacity: 0.8 }}>Edit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              title="Save Field Visit"
              onPress={saveVisit}
              icon={<Feather name="save" size={18} color={colors.primaryForeground} />}
              style={{ marginTop: 18 }}
            />
          )}
        </Animated.View>
      )}

      <LocationPicker
        visible={locationVisible}
        onClose={() => setLocationVisible(false)}
        selectedState={visit.state}
        selectedDistrict={visit.district}
        onSelect={(state: StateEntry, district: DistrictEntry) => {
          setVisit((v) => ({ ...v, state: state.code, stateName: state.name, district: district.code, districtName: district.name }));
          setLocationVisible(false);
        }}
      />
    </ScrollView>
  );
}

function StepHeader({ num, label, colors, dim, hint }: { num: string; label: string; colors: any; dim?: boolean; hint?: string }) {
  return (
    <View style={styles.stepHeader}>
      <View style={[styles.stepNum, { backgroundColor: dim ? colors.muted : colors.primary }]}>
        <Text style={[styles.stepNumText, { color: colors.primaryForeground }]}>{num}</Text>
      </View>
      <Text style={[styles.stepLabel, { color: colors.foreground }]}>{label}</Text>
      {hint && <Text style={[styles.stepHint, { color: colors.mutedForeground }]}>— {hint}</Text>}
    </View>
  );
}

function DoneBadge({ colors }: { colors: any }) {
  return (
    <View style={[styles.doneBadge, { backgroundColor: colors.primary }]}>
      <Feather name="check" size={12} color={colors.primaryForeground} />
    </View>
  );
}

function OptionPill({ label, selected, onPress, colors }: { label: string; selected: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      activeOpacity={0.85}
      style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.card }}
    >
      <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontWeight: "700", fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 14, fontWeight: "500", marginBottom: 10, marginTop: 4, lineHeight: 20 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18, marginBottom: 8 },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 12, fontWeight: "800" },
  stepLabel: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.1 },
  stepHint: { fontSize: 12, fontWeight: "600" },
  empty: { padding: 28, alignItems: "center", gap: 8, borderWidth: 1, borderStyle: "dashed" },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  fieldChip: { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 2, minWidth: 130 },
  progressCard: { padding: 14, borderWidth: 1, gap: 12 },
  progressHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  fieldId: { fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  fieldMeta: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  progressThumb: { width: 48, height: 48, borderRadius: 8 },
  stageCard: { padding: 14, borderWidth: 2, gap: 12 },
  stageHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  stageIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  stageTitle: { fontSize: 15, fontWeight: "700" },
  stageSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  stageImg: { width: "100%", height: 150, borderRadius: 8 },
  doneBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  zoneSummaryCard: { padding: 14, marginTop: 4 },
  zoneSummaryHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  zoneSummaryTitle: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  zoneSummaryHint: { fontSize: 11, fontWeight: "500", marginLeft: 4 },
  zoneSummaryRow: { flexDirection: "row", gap: 8 },
  zonePill: { flex: 1, padding: 10, borderWidth: 1, alignItems: "center", gap: 4 },
  zoneThumb: { width: "100%", height: 60, borderRadius: 6 },
  zoneLabel: { fontSize: 13, fontWeight: "800" },
  zoneMeta: { fontSize: 11, fontWeight: "500" },
  zoneSectionSub: { fontSize: 13, fontWeight: "500", lineHeight: 18, marginBottom: 10, marginTop: -4 },
  zoneCard: { padding: 16, borderWidth: 1, gap: 12 },
  obsCard: { padding: 16, borderWidth: 1, gap: 4, marginTop: 4 },
  obsCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  obsCardTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  obsHint: { fontSize: 11, fontWeight: "500", marginBottom: 8, marginTop: -4 },
  optionalBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  optionalText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  divider: { height: 1, marginVertical: 28 },
  visitHeading: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3, marginBottom: 4 },
  locationBtn: { flexDirection: "row", alignItems: "center", padding: 14, borderWidth: 1, gap: 12, marginBottom: 4 },
  locPrimary: { fontSize: 15, fontWeight: "700" },
  locSecondary: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  locPlaceholder: { fontSize: 15, fontWeight: "500" },
  label: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17, fontWeight: "700" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  visitIdRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, marginTop: 12 },
  visitIdLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  visitIdVal: { fontSize: 14, fontWeight: "800", flex: 1, textAlign: "center" },
  healthCard: { padding: 16, borderWidth: 1, gap: 4 },
  photosCard: { padding: 16, borderWidth: 1, gap: 12 },
  savedBanner: { flexDirection: "row", alignItems: "center", padding: 16, gap: 10 },
  savedText: { fontSize: 15, fontWeight: "700", flex: 1 },
});
