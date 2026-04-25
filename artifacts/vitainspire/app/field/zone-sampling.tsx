import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useStore, type ZoneData } from "@/hooks/useStore";
import { Button } from "@/components/Button";
import { syncZonesToSheet } from "@/utils/sheetSync";
import { uploadFieldPhotos } from "@/utils/driveUpload";

const ZONES = ["A", "B", "C"] as const;
type ZoneKey = "A" | "B" | "C";

const EMPTY_ZONE: ZoneData = { plantUri: null, leafUri: null, cobUri: null, plantHeight: "", plantColor: "", standDensity: "" };

async function pickPhoto(): Promise<string | null> {
  if (Platform.OS === "web") {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    return r.canceled ? null : r.assets[0].uri;
  }
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== "granted") {
    Alert.alert("Camera permission", "Please allow camera access to take photos.");
    return null;
  }
  const r = await ImagePicker.launchCameraAsync({ quality: 0.8 });
  return r.canceled ? null : r.assets[0].uri;
}

export default function ZoneSamplingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fieldId } = useLocalSearchParams<{ fieldId: string }>();
  const { fields, updateField, farmer } = useStore();

  const field = fields.find((f) => f.id === fieldId);

  const [activeZone, setActiveZone] = useState<ZoneKey>("A");
  const [zones, setZones] = useState<Record<ZoneKey, ZoneData>>({
    A: { ...EMPTY_ZONE },
    B: { ...EMPTY_ZONE },
    C: { ...EMPTY_ZONE },
  });
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;
  const zone = zones[activeZone];
  const zoneIndex = ZONES.indexOf(activeZone);
  const isLast = activeZone === "C";

  const updateZone = (patch: Partial<ZoneData>) => {
    setZones((z) => ({ ...z, [activeZone]: { ...z[activeZone], ...patch } }));
  };

  const capturePhoto = async (slot: "plantUri" | "leafUri" | "cobUri") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const uri = await pickPhoto();
    if (!uri) return;
    updateZone({ [slot]: uri });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const nextZone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeZone === "A") setActiveZone("B");
    else if (activeZone === "B") setActiveZone("C");
  };

  const saveAll = async () => {
    if (!fieldId) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const zonesPayload = {
      ...zones,
      capturedBy: farmer?.name ?? "Unknown",
      capturedAt: new Date().toISOString(),
    };
    await updateField(fieldId, { zones: zonesPayload as any });
    const base = fields.find((f) => f.id === fieldId);
    if (base) {
      const updatedField = { ...base, zones: zonesPayload as any };
      syncZonesToSheet(updatedField);
      uploadFieldPhotos(updatedField).catch((e) => console.warn("[drive] zones upload failed", e));
    }
    router.replace(`/field/${fieldId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace(fieldId ? `/field/${fieldId}` : "/home")} style={[styles.iconBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Zone Sampling</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {field ? `Field ${field.numericId} · ${field.cropType} · ${field.id}` : fieldId}
          </Text>
        </View>
      </View>

      {/* Zone progress dots */}
      <View style={[styles.zoneNav, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {ZONES.map((z, i) => {
          const isActive = z === activeZone;
          const isDone = ZONES.indexOf(z) < zoneIndex;
          return (
            <TouchableOpacity
              key={z}
              onPress={() => { Haptics.selectionAsync(); setActiveZone(z); }}
              activeOpacity={0.8}
              style={[
                styles.zoneTab,
                {
                  borderBottomWidth: 3,
                  borderBottomColor: isActive ? colors.primary : "transparent",
                },
              ]}
            >
              <View style={[
                styles.zoneDot,
                {
                  backgroundColor: isDone ? colors.primary : isActive ? colors.primary + "22" : colors.secondary,
                  borderWidth: isActive ? 2 : 0,
                  borderColor: colors.primary,
                },
              ]}>
                {isDone ? (
                  <Feather name="check" size={12} color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.zoneDotText, { color: isActive ? colors.primary : colors.mutedForeground }]}>{z}</Text>
                )}
              </View>
              <Text style={[styles.zoneTabLabel, { color: isActive ? colors.primary : colors.mutedForeground }]}>
                Zone {z}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View key={activeZone} entering={FadeIn.duration(250)} style={{ gap: 20 }}>

          {/* Photos */}
          <View style={{ gap: 10 }}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Zone Photos</Text>
            <ZonePhotoSlot
              label="Standing Plant" required
              uri={zone.plantUri ?? null}
              hint="Full plant, stalk to tip"
              onPress={() => capturePhoto("plantUri")}
              colors={colors}
            />
            <ZonePhotoSlot
              label="Leaf Close-up" required
              uri={zone.leafUri ?? null}
              hint="Visible veins & colour"
              onPress={() => capturePhoto("leafUri")}
              colors={colors}
            />
            <ZonePhotoSlot
              label="Cob (with scale)" required
              uri={zone.cobUri ?? null}
              hint="Include hand or ruler for scale"
              onPress={() => capturePhoto("cobUri")}
              colors={colors}
            />
          </View>

          {/* Ratings */}
          <Animated.View entering={FadeInDown.delay(80).duration(280)} style={{ gap: 16 }}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Rate this zone</Text>

            <View style={[styles.ratingsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={styles.ratingRow}>
                <Text style={[styles.ratingLabel, { color: colors.foreground }]}>Plant Height</Text>
                <View style={styles.pillRow}>
                  {(["Tall", "Medium", "Short"] as const).map((o) => (
                    <RatingPill key={o} label={o} selected={zone.plantHeight === o} onPress={() => updateZone({ plantHeight: o })} colors={colors} />
                  ))}
                </View>
              </View>

              <View style={[styles.ratingDivider, { backgroundColor: colors.border }]} />

              <View style={styles.ratingRow}>
                <Text style={[styles.ratingLabel, { color: colors.foreground }]}>Plant Color</Text>
                <View style={styles.pillRow}>
                  {(["Dark", "Medium", "Pale"] as const).map((o) => (
                    <RatingPill key={o} label={o} selected={zone.plantColor === o} onPress={() => updateZone({ plantColor: o })} colors={colors} />
                  ))}
                </View>
              </View>

              <View style={[styles.ratingDivider, { backgroundColor: colors.border }]} />

              <View style={styles.ratingRow}>
                <Text style={[styles.ratingLabel, { color: colors.foreground }]}>Stand Density</Text>
                <View style={styles.pillRow}>
                  {(["Dense", "Medium", "Sparse"] as const).map((o) => (
                    <RatingPill key={o} label={o} selected={zone.standDensity === o} onPress={() => updateZone({ standDensity: o })} colors={colors} />
                  ))}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* All zones summary strip */}
          <View style={[styles.summaryStrip, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
            {ZONES.map((z) => {
              const zd = zones[z];
              const done = !!(zd.plantUri && zd.leafUri && zd.cobUri);
              const partial = !done && !!(zd.plantUri || zd.leafUri || zd.cobUri);
              return (
                <TouchableOpacity key={z} onPress={() => { Haptics.selectionAsync(); setActiveZone(z); }} style={styles.summaryItem}>
                  {(zd.plantUri || zd.leafUri || zd.cobUri) ? (
                    <Image source={{ uri: (zd.plantUri || zd.leafUri || zd.cobUri)! }} style={styles.summaryThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.summaryThumb, { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="camera" size={14} color={colors.mutedForeground} />
                    </View>
                  )}
                  <Text style={[styles.summaryZoneLabel, { color: done ? colors.foreground : colors.mutedForeground }]}>Zone {z}</Text>
                  {done && <Feather name="check-circle" size={12} color={colors.primary} />}
                  {partial && <Feather name="clock" size={12} color="#f59e0b" />}
                </TouchableOpacity>
              );
            })}
          </View>

        </Animated.View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {isLast ? (
          <Button
            title="Save All Zones"
            onPress={saveAll}
            loading={saving}
            icon={<Feather name="check" size={20} color={colors.primaryForeground} />}
          />
        ) : (
          <Button
            title={`Next — Zone ${activeZone === "A" ? "B" : "C"}`}
            onPress={nextZone}
            icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          />
        )}
        {!isLast && (
          <TouchableOpacity onPress={saveAll} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip remaining & save</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ZonePhotoSlot({ label, required, uri, hint, onPress, colors }: {
  label: string; required?: boolean; uri: string | null; hint: string; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}
      style={{ borderWidth: 2, borderStyle: uri ? "solid" : "dashed", borderColor: uri ? colors.primary : colors.border, borderRadius: 12, overflow: "hidden" }}>
      {uri ? (
        <View style={{ position: "relative" }}>
          <Image source={{ uri }} style={{ width: "100%", height: 140 }} contentFit="cover" />
          <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
            <Feather name="check" size={11} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{label}</Text>
          </View>
          <View style={[styles.retakeBadge, { backgroundColor: colors.primary }]}>
            <Feather name="camera" size={13} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 11 }}>Retake</Text>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: colors.card }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }}>
            <Feather name="camera" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{label}</Text>
              {required && <View style={{ backgroundColor: colors.primary + "22", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 }}><Text style={{ fontSize: 10, fontWeight: "800", color: colors.primary }}>Required</Text></View>}
            </View>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>{hint}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function RatingPill({ label, selected, onPress, colors }: { label: string; selected: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      activeOpacity={0.85}
      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.background }}
    >
      <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontWeight: "700", fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  zoneNav: { flexDirection: "row", borderBottomWidth: 1 },
  zoneTab: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 4 },
  zoneDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  zoneDotText: { fontSize: 13, fontWeight: "800" },
  zoneTabLabel: { fontSize: 11, fontWeight: "700" },
  content: { padding: 16, gap: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  photoCard: { borderWidth: 2, borderStyle: "dashed", borderRadius: 12, overflow: "hidden", minHeight: 220, position: "relative" },
  photoEmpty: { padding: 40, alignItems: "center", gap: 10 },
  photoIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  photoTitle: { fontSize: 16, fontWeight: "700" },
  photoSub: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  photoImg: { width: "100%", height: 260 },
  retakeBadge: { position: "absolute", bottom: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  ratingsCard: { borderWidth: 1, overflow: "hidden" },
  ratingRow: { padding: 14, gap: 10 },
  ratingLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  ratingDivider: { height: 1 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryStrip: { flexDirection: "row", padding: 12, gap: 8 },
  summaryItem: { flex: 1, alignItems: "center", gap: 6 },
  summaryThumb: { width: "100%", aspectRatio: 1, borderRadius: 8 },
  summaryZoneLabel: { fontSize: 11, fontWeight: "700" },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  skipBtn: { alignItems: "center", paddingVertical: 4 },
  skipText: { fontSize: 13, fontWeight: "600" },
});
