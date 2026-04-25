import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useStore, type Field, type FieldStatus } from "@/hooks/useStore";
import { Button } from "@/components/Button";
import { uploadFieldPhotos } from "@/utils/driveUpload";
import { syncFieldToSheet, syncZonesToSheet, syncCutToSheet, syncChoppedToSheet } from "@/utils/sheetSync";

interface StageConfig {
  key: FieldStatus;
  label: string;
  icon: string;
  color: string;
  bg: string;
  nextLabel: string;
  nextRoute: (id: string) => string;
}

const STAGES: StageConfig[] = [
  {
    key: "standing",
    label: "Standing",
    icon: "sprout",
    color: "#15803d",
    bg: "#16a34a22",
    nextLabel: "Record Cut Stage",
    nextRoute: (id) => `/field/cut?fieldId=${id}`,
  },
  {
    key: "cut",
    label: "Cut",
    icon: "content-cut",
    color: "#d97706",
    bg: "#f59e0b22",
    nextLabel: "Record Chopped Stage",
    nextRoute: (id) => `/field/chopped?fieldId=${id}`,
  },
  {
    key: "chopped",
    label: "Chopped",
    icon: "knife",
    color: "#7c3aed",
    bg: "#8b5cf622",
    nextLabel: "Record Silage (Post Harvest)",
    nextRoute: (_id) => `/(tabs)/post-harvest`,
  },
  {
    key: "silage",
    label: "Silage",
    icon: "silo",
    color: "#0369a1",
    bg: "#0891b222",
    nextLabel: "Complete",
    nextRoute: (_id) => `/(tabs)/post-harvest`,
  },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function FieldDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fields, refresh } = useStore();
  const [syncing, setSyncing] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const field = fields.find((f) => f.id === id);
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;

  if (!field) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 16 }}>Field not found</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>ID: {id}</Text>
        <TouchableOpacity onPress={() => router.replace("/home")} activeOpacity={0.7}
          style={{ marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: colors.radius }}>
          <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStageIdx = STAGES.findIndex((s) => s.key === field.status);
  const nextStage = currentStageIdx < STAGES.length - 1 ? STAGES[currentStageIdx + 1] : null;
  const isComplete = field.status === "silage" && !!field.silage;

  const captureNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (field.status === "standing" && !field.zones?.A?.plantUri) {
      router.push(`/field/zone-sampling?fieldId=${field.id}`);
      return;
    }
    // Use the CURRENT stage's nextRoute (not nextStage's), because each stage's
    // nextRoute points to the capture screen for what comes after it.
    const currentStage = STAGES[currentStageIdx];
    if (currentStage) router.push(currentStage.nextRoute(field.id) as any);
  };

  const manualSync = async () => {
    if (!field) return;
    setSyncing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const gasUrl = process.env.EXPO_PUBLIC_GAS_BRIDGE_URL ?? "";
      const sheetUrl = process.env.EXPO_PUBLIC_SHEET_BRIDGE_URL ?? "";
      if (!gasUrl) { Alert.alert("Config missing", "EXPO_PUBLIC_GAS_BRIDGE_URL is not set in environment."); setSyncing(false); return; }

      syncFieldToSheet(field);
      if (field.zones) syncZonesToSheet(field);
      if (field.cut) syncCutToSheet(field);
      if (field.chopped) syncChoppedToSheet(field);

      const results = await uploadFieldPhotos(field);
      const uploaded = Object.values(results).filter(Boolean).length;
      const total = Object.keys(results).length;
      Alert.alert(
        uploaded > 0 ? "✅ Sync complete" : total === 0 ? "No photos to upload" : "⚠️ Upload issues",
        total === 0
          ? "No photos found on this field yet."
          : `${uploaded}/${total} photos uploaded to Drive.\n\nSheet sync sent.\n\nDrive URL: ${gasUrl.slice(0, 50)}...`
      );
    } catch (e: any) {
      Alert.alert("Sync failed", e?.message ?? String(e));
    } finally {
      setSyncing(false);
    }
  };

  const stageIsDone = (s: StageConfig) => {
    const idx = STAGES.findIndex((x) => x.key === s.key);
    const cur = STAGES.findIndex((x) => x.key === field.status);
    return idx < cur || (idx === cur && stageHasData(field, s.key));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace("/home")} style={[styles.iconBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Field {field.numericId}</Text>
            <Text style={[styles.headerIdTag, { color: colors.mutedForeground }]}>{field.id}</Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {field.cropType} · {field.districtName}, {field.stateName}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>

        {/* Field info card */}
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.infoRow}>
            <InfoItem icon="map-marker" label="Location" value={`${field.districtName}, ${field.stateName}`} colors={colors} />
            {field.area ? <InfoItem icon="vector-square" label="Area" value={`${field.area} acres`} colors={colors} /> : null}
          </View>
          {field.cropDetails?.sowingDate ? (
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 }]}>
              <InfoItem icon="calendar" label="Sown" value={field.cropDetails.sowingDate} colors={colors} />
              {field.cropDetails.expectedHarvestDate
                ? <InfoItem icon="calendar-check" label="Harvest due" value={field.cropDetails.expectedHarvestDate} colors={colors} />
                : null}
            </View>
          ) : null}
          {field.gps && (
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 }]}>
              <InfoItem icon="crosshairs-gps" label="GPS" value={`${field.gps.latitude.toFixed(5)}, ${field.gps.longitude.toFixed(5)}`} colors={colors} />
            </View>
          )}
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 }]}>
            <InfoItem icon="account" label="Registered by" value={field.createdBy} colors={colors} />
            <InfoItem icon="clock-outline" label="On" value={fmtDate(field.createdAt)} colors={colors} />
          </View>
        </Animated.View>

        {/* Stage pipeline */}
        <Text style={[styles.pipelineTitle, { color: colors.foreground }]}>Field Progress</Text>

        <View style={{ gap: 12 }}>
          {STAGES.map((stage, i) => {
            const done = stageIsDone(stage);
            const active = field.status === stage.key;
            const pending = !done && !active;
            const thumb = getStageThumb(field, stage.key);
            const capturedBy = getStageCapturedBy(field, stage.key);
            const capturedAt = getStageCapturedAt(field, stage.key);

            return (
              <Animated.View key={stage.key} entering={FadeInDown.delay(i * 60).duration(300)}>
                <View style={[
                  styles.stageCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: active ? stage.color : colors.border,
                    borderRadius: colors.radius,
                    borderWidth: active ? 2 : 1,
                    opacity: pending ? 0.6 : 1,
                  },
                ]}>
                  <View style={styles.stageCardTop}>
                    {/* Icon + status */}
                    <View style={[styles.stageIconWrap, { backgroundColor: done || active ? stage.bg : colors.secondary }]}>
                      <MaterialCommunityIcons name={stage.icon as any} size={22} color={done || active ? stage.color : colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={[styles.stageLabel, { color: colors.foreground }]}>{stage.label}</Text>
                        {done && (
                          <View style={[styles.doneBadge, { backgroundColor: stage.bg }]}>
                            <Feather name="check" size={10} color={stage.color} />
                            <Text style={[styles.doneText, { color: stage.color }]}>Done</Text>
                          </View>
                        )}
                        {active && !done && (
                          <View style={[styles.doneBadge, { backgroundColor: stage.bg }]}>
                            <Text style={[styles.doneText, { color: stage.color }]}>In progress</Text>
                          </View>
                        )}
                        {pending && (
                          <View style={[styles.doneBadge, { backgroundColor: colors.secondary }]}>
                            <Text style={[styles.doneText, { color: colors.mutedForeground }]}>Pending</Text>
                          </View>
                        )}
                      </View>
                      {capturedBy && capturedAt && (
                        <Text style={[styles.auditText, { color: colors.mutedForeground }]}>
                          By {capturedBy} · {fmtDate(capturedAt)} at {fmtTime(capturedAt)}
                        </Text>
                      )}
                    </View>
                    {thumb && (
                      <Image source={{ uri: thumb }} style={styles.stageThumb} contentFit="cover" />
                    )}
                  </View>

                  {/* Zone thumbnails for standing */}
                  {stage.key === "standing" && field.zones && (
                    <View style={[styles.zoneRow, { borderTopColor: colors.border }]}>
                      {(["A", "B", "C"] as const).map((z) => {
                        const zd = field.zones![z];
                        return (
                          <View key={z} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                            {zd?.plantUri ? (
                              <Image source={{ uri: zd.plantUri }} style={styles.zoneThumb} contentFit="cover" />
                            ) : (
                              <View style={[styles.zoneThumb, { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
                                <Feather name="camera" size={12} color={colors.mutedForeground} />
                              </View>
                            )}
                            <Text style={[styles.zoneLabel, { color: colors.mutedForeground }]}>Zone {z}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {!isComplete && (
          field.status === "standing" && !field.zones?.A?.plantUri ? (
            <Button title="Capture Zone Sampling" onPress={captureNext} icon={<Feather name="camera" size={20} color={colors.primaryForeground} />} />
          ) : nextStage ? (
            <Button title={`Capture Next: ${nextStage.label}`} onPress={captureNext} icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />} />
          ) : null
        )}
        {isComplete && (
          <View style={[styles.completeBanner, { backgroundColor: "#16a34a22", borderRadius: colors.radius }]}>
            <Feather name="check-circle" size={20} color="#15803d" />
            <Text style={{ color: "#15803d", fontWeight: "800", fontSize: 15 }}>All stages complete</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={manualSync}
          disabled={syncing}
          activeOpacity={0.75}
          style={[styles.syncBtn, { borderColor: colors.border, opacity: syncing ? 0.5 : 1 }]}
        >
          <Feather name={syncing ? "loader" : "upload-cloud"} size={15} color={colors.mutedForeground} />
          <Text style={[styles.syncText, { color: colors.mutedForeground }]}>
            {syncing ? "Syncing…" : "Sync to Drive & Sheets"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function stageHasData(field: Field, key: FieldStatus): boolean {
  if (key === "standing") return !!(field.zones?.A?.plantUri);
  if (key === "cut") return !!field.cut;
  if (key === "chopped") return !!field.chopped;
  if (key === "silage") return !!field.silage;
  return false;
}

function getStageThumb(field: Field, key: FieldStatus): string | null {
  if (key === "standing") return field.zones?.A?.plantUri ?? null;
  if (key === "cut") return field.cut?.uri ?? null;
  if (key === "chopped") return field.chopped?.uri ?? null;
  return null;
}

function getStageCapturedBy(field: Field, key: FieldStatus): string | null {
  if (key === "standing") return field.zones?.capturedBy ?? field.standing?.capturedBy ?? null;
  if (key === "cut") return field.cut?.capturedBy ?? null;
  if (key === "chopped") return field.chopped?.capturedBy ?? null;
  return null;
}

function getStageCapturedAt(field: Field, key: FieldStatus): string | null {
  if (key === "standing") return field.zones?.capturedAt ?? field.standing?.capturedAt ?? null;
  if (key === "cut") return field.cut?.capturedAt ?? null;
  if (key === "chopped") return field.chopped?.capturedAt ?? null;
  return null;
}

// ── sub-components ────────────────────────────────────────────────────────────

function InfoItem({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <MaterialCommunityIcons name={icon as any} size={12} color={colors.mutedForeground} />
        <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, color: colors.mutedForeground }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.3 },
  headerIdTag: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  content: { padding: 16, gap: 16 },
  infoCard: { padding: 16, borderWidth: 1, gap: 4 },
  infoRow: { flexDirection: "row", gap: 16 },
  pipelineTitle: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  stageCard: { overflow: "hidden" },
  stageCardTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  stageIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  stageLabel: { fontSize: 15, fontWeight: "800" },
  doneBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  doneText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  auditText: { fontSize: 11, fontWeight: "600" },
  stageThumb: { width: 52, height: 52, borderRadius: 8 },
  zoneRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1 },
  zoneThumb: { width: "100%", aspectRatio: 1, borderRadius: 6 },
  zoneLabel: { fontSize: 10, fontWeight: "700" },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  completeBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16 },
  syncBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderWidth: 1, borderRadius: 10, borderStyle: "dashed" },
  syncText: { fontSize: 13, fontWeight: "600" },
});
