import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Animated, { FadeIn } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useStore, type SilageData } from "@/hooks/useStore";
import { Button } from "@/components/Button";
import { CapturePhotoCard } from "@/components/CapturePhotoCard";

function generateSampleId(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `SMP-${d}-${r}`;
}

function computeGrade(
  pH: string,
  smell: string,
  mold: string
): { grade: "A" | "B" | "C" | ""; needsReview: boolean } {
  if (!pH || !smell || !mold) return { grade: "", needsReview: false };
  if (pH === "<4.2" && smell === "Pleasant" && mold === "None")
    return { grade: "A", needsReview: false };
  if (pH === ">4.8" || smell === "Foul" || mold === "Deep")
    return { grade: "C", needsReview: true };
  return { grade: "B", needsReview: mold !== "None" };
}

function emptySilage(): SilageData {
  return {
    sampleId: generateSampleId(),
    gps: null,
    eligibilityConfirmed: false,
    ready: false,
    photos: { storage: null, crossSection: null, sample: null, texture: null },
    pH: "",
    smell: "",
    moisture: "",
    mold: "",
    temperature: "",
    cropType: "",
    storageType: "",
    age: "",
    recentWeather: "",
    feedingStatus: "",
    grade: "",
    needsReview: false,
    submittedAt: "",
  };
}

const CROP_TYPES = ["Maize", "Rice", "Wheat", "Sugarcane", "Cotton"] as const;

export default function PostHarvestTab() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fields, updateField, refresh } = useStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [silage, setSilage] = useState<SilageData>(emptySilage());
  const [submitted, setSubmitted] = useState(false);
  const gpsFetched = useRef(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Auto-capture GPS once when tab first renders
  useEffect(() => {
    if (gpsFetched.current) return;
    gpsFetched.current = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setSilage((s) => ({
          ...s,
          gps: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
        }));
      } catch {
        // GPS not available — silently skip
      }
    })();
  }, []);

  const selected = fields.find((f) => f.id === selectedId) ?? null;

  const selectField = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(id);
    const f = fields.find((x) => x.id === id);
    if (f?.silage) {
      setSilage(f.silage);
      setSubmitted(!!f.silage.submittedAt);
    } else {
      setSilage(emptySilage());
      setSubmitted(false);
    }
  };

  const set = <K extends keyof SilageData>(key: K, value: SilageData[K]) => {
    setSilage((s) => ({ ...s, [key]: value }));
  };

  const photosComplete =
    !!silage.photos.storage &&
    !!silage.photos.crossSection &&
    !!silage.photos.sample &&
    !!silage.photos.texture;

  const coreComplete = silage.pH !== "" && silage.smell !== "" && silage.mold !== "";

  const canSubmit =
    !!selected &&
    silage.eligibilityConfirmed &&
    photosComplete &&
    coreComplete &&
    silage.moisture !== "" &&
    silage.temperature !== "" &&
    silage.cropType !== "" &&
    silage.storageType !== "" &&
    silage.age !== "" &&
    silage.recentWeather !== "" &&
    silage.feedingStatus !== "";

  const { grade, needsReview } = computeGrade(silage.pH, silage.smell, silage.mold);

  const submit = async () => {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data: SilageData = {
      ...silage,
      grade,
      needsReview,
      ready: true,
      submittedAt: new Date().toISOString(),
    };
    await updateField(selected.id, { silage: data, status: "silage" });
    setSilage(data);
    setSubmitted(true);
  };

  const bottomPad = Platform.OS === "web" ? 110 : 100;

  const gradeColor =
    grade === "A"
      ? colors.success
      : grade === "B"
      ? colors.warning
      : grade === "C"
      ? colors.destructive
      : colors.muted;

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
          <Text style={[styles.h1, { color: colors.foreground }]}>Post Harvest</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Record silage sample data — photos, pH, sensory assessment, and context.
          </Text>
        </View>
      </View>

      {/* Field selector */}
      <Text style={[styles.section, { color: colors.foreground }]}>Select Field</Text>

      {fields.length === 0 ? (
        <View
          style={[
            styles.empty,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <MaterialCommunityIcons name="silo-outline" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No fields yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Create a field in Field Capture first
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
        >
          {fields.map((f) => {
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
                <Text
                  style={{
                    color: isSel ? colors.primaryForeground : colors.foreground,
                    fontWeight: "800",
                    fontSize: 14,
                    letterSpacing: 0.3,
                  }}
                >
                  {f.id}
                </Text>
                {f.silage?.submittedAt ? (
                  <View
                    style={[
                      styles.savedDot,
                      {
                        backgroundColor: isSel
                          ? "rgba(255,255,255,0.3)"
                          : colors.primary,
                      },
                    ]}
                  >
                    <Feather name="check" size={9} color={colors.primaryForeground} />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selected && (
        <Animated.View entering={FadeIn.duration(250)}>

          {/* ── IDENTIFICATION ── */}
          <Text style={[styles.section, { color: colors.foreground }]}>Identification</Text>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <InfoRow label="Sample ID" value={silage.sampleId} colors={colors} mono />
            <InfoRow label="Field ID" value={selected.id} colors={colors} mono />
            <InfoRow
              label="GPS"
              value={
                silage.gps
                  ? `${silage.gps.latitude.toFixed(5)}, ${silage.gps.longitude.toFixed(5)}`
                  : "Acquiring…"
              }
              colors={colors}
            />
          </View>

          {/* ── VALIDATION ── */}
          <Text style={[styles.section, { color: colors.foreground }]}>Validation</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              set("eligibilityConfirmed", !silage.eligibilityConfirmed);
            }}
            activeOpacity={0.85}
            style={[
              styles.eligibilityCard,
              {
                backgroundColor: silage.eligibilityConfirmed
                  ? colors.primary
                  : colors.card,
                borderColor: silage.eligibilityConfirmed ? colors.primary : colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View
              style={[
                styles.eligibilityCheck,
                {
                  backgroundColor: silage.eligibilityConfirmed
                    ? "rgba(255,255,255,0.25)"
                    : colors.secondary,
                },
              ]}
            >
              {silage.eligibilityConfirmed ? (
                <Feather
                  name="check"
                  size={18}
                  color={colors.primaryForeground}
                />
              ) : (
                <Feather name="square" size={18} color={colors.mutedForeground} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.eligibilityTitle,
                  {
                    color: silage.eligibilityConfirmed
                      ? colors.primaryForeground
                      : colors.foreground,
                  },
                ]}
              >
                Eligibility Confirmed
              </Text>
              <Text
                style={[
                  styles.eligibilitySub,
                  {
                    color: silage.eligibilityConfirmed
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                    opacity: 0.85,
                  },
                ]}
              >
                45+ days fermented, freshly opened
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── PHOTOS ── */}
          <Text style={[styles.section, { color: colors.foreground }]}>
            Required Photos
          </Text>
          <View
            style={[
              styles.photosCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <CapturePhotoCard
              label="Storage Overview"
              hint="Wide shot of the silo, pit, or bag"
              uri={silage.photos.storage}
              onChange={(uri) =>
                setSilage((s) => ({ ...s, photos: { ...s.photos, storage: uri } }))
              }
              height={150}
            />
            <CapturePhotoCard
              label="Cross-Section"
              hint="Cut through to show layers"
              uri={silage.photos.crossSection}
              onChange={(uri) =>
                setSilage((s) => ({ ...s, photos: { ...s.photos, crossSection: uri } }))
              }
              height={150}
            />
            <CapturePhotoCard
              label="Sample Bag"
              hint="Handful of silage in the sample bag"
              uri={silage.photos.sample}
              onChange={(uri) =>
                setSilage((s) => ({ ...s, photos: { ...s.photos, sample: uri } }))
              }
              height={150}
            />
            <CapturePhotoCard
              label="Color & Texture"
              hint="Close-up showing chop length and feel"
              uri={silage.photos.texture}
              onChange={(uri) =>
                setSilage((s) => ({ ...s, photos: { ...s.photos, texture: uri } }))
              }
              height={150}
            />
          </View>

          {/* ── pH READING ── */}
          <Text style={[styles.section, { color: colors.foreground }]}>pH Reading</Text>
          <View style={styles.pillRow}>
            {(["<4.2", "4.2-4.8", ">4.8"] as const).map((o) => (
              <OptionPill
                key={o}
                label={o}
                selected={silage.pH === o}
                onPress={() => set("pH", o)}
                colors={colors}
              />
            ))}
          </View>

          {/* ── SENSORY ASSESSMENT ── */}
          <Text style={[styles.section, { color: colors.foreground }]}>
            Sensory Assessment
          </Text>
          <View
            style={[
              styles.sensoryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.label, { color: colors.foreground }]}>Smell</Text>
            <View style={styles.pillRow}>
              {(["Pleasant", "Neutral", "Foul"] as const).map((o) => (
                <OptionPill
                  key={o}
                  label={o}
                  selected={silage.smell === o}
                  onPress={() => set("smell", o)}
                  colors={colors}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>
              Moisture
            </Text>
            <View style={styles.pillRow}>
              {(["Dry", "Optimal", "Wet"] as const).map((o) => (
                <OptionPill
                  key={o}
                  label={o}
                  selected={silage.moisture === o}
                  onPress={() => set("moisture", o)}
                  colors={colors}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>
              Mold
            </Text>
            <View style={styles.pillRow}>
              {(["None", "Surface", "Deep"] as const).map((o) => (
                <OptionPill
                  key={o}
                  label={o}
                  selected={silage.mold === o}
                  onPress={() => set("mold", o)}
                  colors={colors}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>
              Temperature
            </Text>
            <View style={styles.pillRow}>
              {(["Cool", "Warm", "Hot"] as const).map((o) => (
                <OptionPill
                  key={o}
                  label={o}
                  selected={silage.temperature === o}
                  onPress={() => set("temperature", o)}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          {/* ── CONTEXT ── */}
          <Text style={[styles.section, { color: colors.foreground }]}>Context</Text>
          <View
            style={[
              styles.contextCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.label, { color: colors.foreground }]}>Crop Type</Text>
            <View style={styles.pillRow}>
              {CROP_TYPES.map((o) => (
                <OptionPill
                  key={o}
                  label={o}
                  selected={silage.cropType === o}
                  onPress={() => set("cropType", o)}
                  colors={colors}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>
              Storage Type
            </Text>
            <View style={styles.pillRow}>
              {(["Pit", "Bag", "Bunker"] as const).map((o) => (
                <OptionPill
                  key={o}
                  label={o}
                  selected={silage.storageType === o}
                  onPress={() => set("storageType", o)}
                  colors={colors}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>
              Age (days)
            </Text>
            <View style={styles.pillRow}>
              {(["30-45", "45-60", "60+"] as const).map((o) => (
                <OptionPill
                  key={o}
                  label={o}
                  selected={silage.age === o}
                  onPress={() => set("age", o)}
                  colors={colors}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>
              Recent Weather
            </Text>
            <View style={styles.pillRow}>
              {(["Dry", "Mixed", "Wet"] as const).map((o) => (
                <OptionPill
                  key={o}
                  label={o}
                  selected={silage.recentWeather === o}
                  onPress={() => set("recentWeather", o)}
                  colors={colors}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>
              Feeding Status
            </Text>
            <View style={styles.pillRow}>
              {(["Just Opened", "Mid-feed", "Almost Done"] as const).map((o) => (
                <OptionPill
                  key={o}
                  label={o}
                  selected={silage.feedingStatus === o}
                  onPress={() => set("feedingStatus", o)}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          {/* ── AUTO-COMPUTED GRADE ── */}
          {grade !== "" && (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text style={[styles.section, { color: colors.foreground }]}>
                Auto-Computed Grade
              </Text>
              <View
                style={[
                  styles.gradeCard,
                  {
                    backgroundColor: gradeColor + "18",
                    borderColor: gradeColor,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View style={[styles.gradeBadge, { backgroundColor: gradeColor }]}>
                  <Text style={styles.gradeText}>Grade {grade}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gradeDesc, { color: colors.foreground }]}>
                    {grade === "A"
                      ? "Excellent quality silage"
                      : grade === "B"
                      ? "Acceptable quality silage"
                      : "Poor quality — review required"}
                  </Text>
                  {needsReview && (
                    <View style={styles.reviewRow}>
                      <Feather name="alert-triangle" size={13} color={colors.destructive} />
                      <Text style={[styles.reviewText, { color: colors.destructive }]}>
                        Needs Review
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── SUBMIT ── */}
          {submitted ? (
            <View
              style={[
                styles.doneBanner,
                { backgroundColor: colors.primary, borderRadius: colors.radius },
              ]}
            >
              <View style={styles.doneIconWrap}>
                <Feather name="check" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.doneTitle, { color: colors.primaryForeground }]}>
                  Silage Recorded
                </Text>
                <Text
                  style={[
                    styles.doneSub,
                    { color: colors.primaryForeground, opacity: 0.8 },
                  ]}
                >
                  {silage.sampleId} · Grade {silage.grade}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSubmitted(false)} hitSlop={8}>
                <Text
                  style={{
                    color: colors.primaryForeground,
                    fontWeight: "700",
                    fontSize: 13,
                    opacity: 0.8,
                  }}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              title="Submit Silage Record"
              onPress={submit}
              disabled={!canSubmit}
              icon={
                <Feather name="check-circle" size={20} color={colors.primaryForeground} />
              }
              style={{ marginTop: 22 }}
            />
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  colors,
  mono,
}: {
  label: string;
  value: string;
  colors: any;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text
        style={[
          styles.infoVal,
          { color: colors.foreground },
          mono && { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function OptionPill({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.85}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.card,
      }}
    >
      <Text
        style={{
          color: selected ? colors.primaryForeground : colors.foreground,
          fontWeight: "700",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 14, fontWeight: "500", marginBottom: 18, marginTop: 4, lineHeight: 20 },
  section: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 22,
    marginBottom: 10,
  },
  empty: {
    padding: 28,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  fieldChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  savedDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: { padding: 14, borderWidth: 1, gap: 10 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  infoVal: { fontSize: 13, fontWeight: "700", flex: 1, textAlign: "right", marginLeft: 12 },
  eligibilityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
    gap: 14,
  },
  eligibilityCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  eligibilityTitle: { fontSize: 15, fontWeight: "700" },
  eligibilitySub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  photosCard: { padding: 16, borderWidth: 1, gap: 12 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  sensoryCard: { padding: 16, borderWidth: 1, gap: 4 },
  contextCard: { padding: 16, borderWidth: 1, gap: 4 },
  gradeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
    gap: 14,
  },
  gradeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  gradeDesc: { fontSize: 14, fontWeight: "600" },
  reviewRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  reviewText: { fontSize: 12, fontWeight: "700" },
  doneBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    marginTop: 22,
  },
  doneIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: { fontSize: 16, fontWeight: "800" },
  doneSub: { fontSize: 13, fontWeight: "600", marginTop: 2 },
});
