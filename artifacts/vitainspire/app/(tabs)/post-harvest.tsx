import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useStore, type SilageData } from "@/hooks/useStore";
import { Button } from "@/components/Button";
import { CapturePhotoCard } from "@/components/CapturePhotoCard";

type Step = "select" | "ready-check" | "capture" | "data" | "submit" | "done";

const SMELL_OPTIONS = ["Pleasant (lactic)", "Neutral", "Vinegar", "Sour/Foul"];
const MOLD_OPTIONS = ["None", "Surface only", "Some pockets", "Deep mold"];

function gradeFor(pH: string, smell: string, mold: string): "A" | "B" | "C" {
  const ph = parseFloat(pH);
  const foul = smell.toLowerCase().includes("foul") || smell.toLowerCase().includes("vinegar");
  const deepMold = mold === "Deep mold" || mold === "Some pockets";
  if (!Number.isNaN(ph) && ph > 4.8) return "C";
  if (foul || mold === "Deep mold") return "C";
  if (!Number.isNaN(ph) && ph < 4.2 && mold === "None" && smell.startsWith("Pleasant")) return "A";
  if (deepMold) return "B";
  return "B";
}

export default function PostHarvestTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fields, updateField, refresh } = useStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [silage, setSilage] = useState<SilageData>({
    ready: false,
    photos: { storage: null, crossSection: null, sample: null, texture: null },
    pH: "",
    smell: "",
    mold: "",
    grade: "",
    submittedAt: "",
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const eligibleFields = fields.filter((f) => f.chopped);
  const selected = eligibleFields.find((f) => f.id === selectedId) ?? null;

  const reset = () => {
    setSelectedId(null);
    setStep("select");
    setSilage({
      ready: false,
      photos: { storage: null, crossSection: null, sample: null, texture: null },
      pH: "",
      smell: "",
      mold: "",
      grade: "",
      submittedAt: "",
    });
  };

  const selectField = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(id);
    const existing = fields.find((f) => f.id === id)?.silage;
    if (existing) setSilage(existing);
    setStep("ready-check");
  };

  const setReady = (ready: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!ready) {
      Alert.alert("OK", "Come back when the silage has fermented.", [
        { text: "Done", onPress: reset },
      ]);
      return;
    }
    setSilage((s) => ({ ...s, ready: true }));
    setStep("capture");
  };

  const photosComplete =
    !!silage.photos.storage &&
    !!silage.photos.crossSection &&
    !!silage.photos.sample &&
    !!silage.photos.texture;

  const dataComplete =
    silage.pH.trim() !== "" && silage.smell !== "" && silage.mold !== "";

  const submit = async () => {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const grade = gradeFor(silage.pH, silage.smell, silage.mold);
    const data: SilageData = {
      ...silage,
      grade,
      submittedAt: new Date().toISOString(),
    };
    await updateField(selected.id, { silage: data, status: "silage" });
    setSilage(data);
    setStep("done");
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 110 : 100;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 8, paddingBottom: bottomPad },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.h1, { color: colors.foreground }]}>Post Harvest</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Record silage condition once chopping is complete and fermentation has finished.
      </Text>

      {/* STEP: SELECT */}
      {step === "select" && (
        <>
          <Text style={[styles.section, { color: colors.foreground }]}>1. Select a field</Text>
          {eligibleFields.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <MaterialCommunityIcons name="silo-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No chopped fields yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Complete chopping in the Harvest tab first
              </Text>
            </View>
          ) : (
            eligibleFields.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => selectField(f.id)}
                activeOpacity={0.85}
                style={[
                  styles.fieldRow,
                  { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
                ]}
              >
                <View style={[styles.fieldIcon, { backgroundColor: colors.secondary }]}>
                  <MaterialCommunityIcons name="silo" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldId, { color: colors.foreground }]}>{f.id}</Text>
                  <Text style={[styles.fieldMeta, { color: colors.mutedForeground }]}>
                    {f.cropType} · chopped{" "}
                    {f.chopped ? new Date(f.chopped.capturedAt).toLocaleDateString() : ""}
                  </Text>
                </View>
                {f.silage?.submittedAt ? (
                  <View style={[styles.gradePill, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>
                      Grade {f.silage.grade}
                    </Text>
                  </View>
                ) : (
                  <Feather name="chevron-right" size={20} color={colors.foreground} />
                )}
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      {/* STEP: READY CHECK */}
      {step === "ready-check" && selected && (
        <Animated.View entering={FadeIn.duration(250)}>
          <FieldHeader field={selected} colors={colors} onChange={reset} />
          <Text style={[styles.section, { color: colors.foreground }]}>2. Condition check</Text>
          <View
            style={[
              styles.questionCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={32} color={colors.primary} />
            <Text style={[styles.qTitle, { color: colors.foreground }]}>Is silage ready?</Text>
            <Text style={[styles.qSub, { color: colors.mutedForeground }]}>
              Silage usually needs 21+ days of fermentation before opening
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Button
                title="Not yet"
                variant="outline"
                onPress={() => setReady(false)}
                style={{ flex: 1 }}
                icon={<Feather name="clock" size={18} color={colors.primary} />}
              />
              <Button
                title="Yes, continue"
                onPress={() => setReady(true)}
                style={{ flex: 1 }}
                icon={<Feather name="check" size={18} color={colors.primaryForeground} />}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* STEP: CAPTURE photos */}
      {step === "capture" && selected && (
        <Animated.View entering={FadeIn.duration(250)}>
          <FieldHeader field={selected} colors={colors} onChange={reset} />
          <Text style={[styles.section, { color: colors.foreground }]}>3. Silage photos</Text>

          <CapturePhotoCard
            label="Storage Overview"
            hint="Wide shot of the silo or bag"
            uri={silage.photos.storage}
            onChange={(uri) =>
              setSilage((s) => ({ ...s, photos: { ...s.photos, storage: uri } }))
            }
          />
          <CapturePhotoCard
            label="Cross-Section"
            hint="Cut through the pile to show layers"
            uri={silage.photos.crossSection}
            onChange={(uri) =>
              setSilage((s) => ({ ...s, photos: { ...s.photos, crossSection: uri } }))
            }
          />
          <CapturePhotoCard
            label="Sample"
            hint="Handful of silage you'll measure"
            uri={silage.photos.sample}
            onChange={(uri) =>
              setSilage((s) => ({ ...s, photos: { ...s.photos, sample: uri } }))
            }
          />
          <CapturePhotoCard
            label="Texture"
            hint="Close-up showing chop length and feel"
            uri={silage.photos.texture}
            onChange={(uri) =>
              setSilage((s) => ({ ...s, photos: { ...s.photos, texture: uri } }))
            }
          />

          <Button
            title="Continue to data"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setStep("data");
            }}
            disabled={!photosComplete}
            icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
            style={{ marginTop: 12 }}
          />
        </Animated.View>
      )}

      {/* STEP: DATA */}
      {step === "data" && selected && (
        <Animated.View entering={FadeIn.duration(250)}>
          <FieldHeader field={selected} colors={colors} onChange={reset} />
          <Text style={[styles.section, { color: colors.foreground }]}>4. Data</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>pH (3.5 – 6.0)</Text>
          <TextInput
            value={silage.pH}
            onChangeText={(t) => setSilage((s) => ({ ...s, pH: t }))}
            placeholder="e.g. 4.1"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          />

          <Text style={[styles.label, { color: colors.foreground, marginTop: 18 }]}>Smell</Text>
          <View style={styles.optGrid}>
            {SMELL_OPTIONS.map((o) => (
              <OptionPill
                key={o}
                label={o}
                selected={silage.smell === o}
                onPress={() => setSilage((s) => ({ ...s, smell: o }))}
                colors={colors}
              />
            ))}
          </View>

          <Text style={[styles.label, { color: colors.foreground, marginTop: 18 }]}>Mold</Text>
          <View style={styles.optGrid}>
            {MOLD_OPTIONS.map((o) => (
              <OptionPill
                key={o}
                label={o}
                selected={silage.mold === o}
                onPress={() => setSilage((s) => ({ ...s, mold: o }))}
                colors={colors}
              />
            ))}
          </View>

          {dataComplete && (
            <View
              style={[
                styles.gradePreview,
                { backgroundColor: colors.secondary, borderRadius: colors.radius },
              ]}
            >
              <Text style={[styles.gradeLabel, { color: colors.mutedForeground }]}>
                AUTO GRADE
              </Text>
              <Text style={[styles.gradeBig, { color: colors.primary }]}>
                {gradeFor(silage.pH, silage.smell, silage.mold)}
              </Text>
            </View>
          )}

          <Button
            title="Submit"
            onPress={submit}
            disabled={!dataComplete}
            icon={<Feather name="check-circle" size={20} color={colors.primaryForeground} />}
            style={{ marginTop: 18 }}
          />
        </Animated.View>
      )}

      {/* STEP: DONE */}
      {step === "done" && selected && (
        <Animated.View entering={FadeIn.duration(250)}>
          <View
            style={[
              styles.doneCard,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.doneIcon}>
              <Feather name="check" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.primaryForeground }]}>
              Silage Submitted
            </Text>
            <Text style={[styles.doneId, { color: colors.primaryForeground }]}>{selected.id}</Text>
            <View style={styles.doneGradeBox}>
              <Text style={{ color: colors.primaryForeground, opacity: 0.8, fontSize: 12, fontWeight: "700", letterSpacing: 1.4 }}>
                GRADE
              </Text>
              <Text style={[styles.doneGrade, { color: colors.primaryForeground }]}>
                {silage.grade}
              </Text>
            </View>
          </View>
          <Button
            title="Done"
            variant="outline"
            onPress={reset}
            style={{ marginTop: 18 }}
            icon={<Feather name="arrow-left" size={18} color={colors.primary} />}
          />
        </Animated.View>
      )}
    </ScrollView>
  );
}

function FieldHeader({
  field,
  colors,
  onChange,
}: {
  field: any;
  colors: any;
  onChange: () => void;
}) {
  return (
    <View
      style={[
        styles.fieldHeaderCard,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
      ]}
    >
      <View style={[styles.fieldIcon, { backgroundColor: colors.secondary }]}>
        <MaterialCommunityIcons name="silo" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.fieldId, { color: colors.foreground }]}>{field.id}</Text>
        <Text style={[styles.fieldMeta, { color: colors.mutedForeground }]}>
          {field.cropType} · {field.area || "—"} acres
        </Text>
      </View>
      <TouchableOpacity onPress={onChange} hitSlop={10}>
        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Change</Text>
      </TouchableOpacity>
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
  h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 14, fontWeight: "500", marginBottom: 18, marginTop: 4, lineHeight: 20 },
  section: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 16,
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
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  fieldHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldId: { fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  fieldMeta: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  gradePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  questionCard: {
    padding: 22,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  qTitle: { fontSize: 22, fontWeight: "800", marginTop: 6 },
  qSub: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  label: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: "700",
  },
  optGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gradePreview: {
    marginTop: 18,
    padding: 18,
    alignItems: "center",
  },
  gradeLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  gradeBig: { fontSize: 56, fontWeight: "900", letterSpacing: -2, lineHeight: 64 },
  doneCard: { padding: 30, alignItems: "center", gap: 6, marginTop: 24 },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  doneTitle: { fontSize: 20, fontWeight: "800" },
  doneId: { fontSize: 14, fontWeight: "700", opacity: 0.85, letterSpacing: 0.5 },
  doneGradeBox: {
    marginTop: 18,
    padding: 18,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    minWidth: 140,
  },
  doneGrade: { fontSize: 56, fontWeight: "900", letterSpacing: -2, lineHeight: 64, marginTop: 4 },
});
