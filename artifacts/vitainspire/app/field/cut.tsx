import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/Button";
import { syncCutToSheet } from "@/utils/sheetSync";
import { uploadFieldPhotos } from "@/utils/driveUpload";

async function pickPhoto(): Promise<string | null> {
  if (Platform.OS === "web") {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    return r.canceled ? null : r.assets[0].uri;
  }
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== "granted") {
    Alert.alert("Camera permission", "Please allow camera access.");
    return null;
  }
  const r = await ImagePicker.launchCameraAsync({ quality: 0.8 });
  return r.canceled ? null : r.assets[0].uri;
}

type HarvestMethod = "Manual" | "Machine" | "";
type CropCondition = "Green" | "Dry" | "Mixed" | "";
type CuttingHeight = "Low" | "Medium" | "High" | "";
type Lodging = "None" | "Some" | "Heavy" | "";

export default function CutCaptureScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fieldId } = useLocalSearchParams<{ fieldId: string }>();
  const { fields, updateField, farmer } = useStore();

  const field = fields.find((f) => f.id === fieldId);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [harvestMethod, setHarvestMethod] = useState<HarvestMethod>("");
  const [cropCondition, setCropCondition] = useState<CropCondition>("");
  const [cuttingHeight, setCuttingHeight] = useState<CuttingHeight>("");
  const [lodging, setLodging] = useState<Lodging>("");
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;

  const capture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const uri = await pickPhoto();
    if (!uri) return;
    setPhotoUri(uri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const canSave = !!photoUri && !!harvestMethod && !!cropCondition;

  const save = async () => {
    if (!fieldId || !canSave) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date().toISOString();
    const by = farmer?.name ?? "Unknown";
    const cutPatch = {
      status: "cut" as const,
      cut: { uri: photoUri!, capturedAt: now, capturedBy: by },
      cutData: { harvestMethod, cropCondition, cuttingHeight, lodging, capturedBy: by, savedAt: now },
    };
    await updateField(fieldId, cutPatch);
    if (field) {
      const updatedField = { ...field, ...cutPatch };
      syncCutToSheet(updatedField);
      uploadFieldPhotos(updatedField).catch((e) => console.warn("[drive] cut upload failed", e));
    }
    router.replace(`/field/${fieldId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace(`/field/${fieldId}`)} style={[styles.iconBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cut Stage</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {field ? `Field ${field.numericId} · ${field.cropType} · ${field.id}` : fieldId}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: "#f59e0b22" }]}>
          <Text style={[styles.statusText, { color: "#d97706" }]}>Cut</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Zone reference strip */}
        {field?.zones && (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.zoneStrip, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
            <Text style={[styles.stripLabel, { color: colors.mutedForeground }]}>Standing zone data</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {(["A", "B", "C"] as const).map((z) => {
                const zd = field.zones![z];
                const thumb = zd?.plantUri || zd?.leafUri || zd?.cobUri;
                return (
                  <View key={z} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.zoneThumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.zoneThumb, { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
                        <Feather name="image" size={14} color={colors.mutedForeground} />
                      </View>
                    )}
                    <Text style={[styles.zoneLabel, { color: colors.mutedForeground }]}>Zone {z}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Photo capture */}
        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Cut Plant Photo</Text>
            <View style={[styles.reqBadge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.reqText, { color: colors.primary }]}>Required</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={capture}
            activeOpacity={0.88}
            style={[styles.photoCard, { backgroundColor: colors.card, borderColor: photoUri ? colors.primary : colors.border, borderRadius: colors.radius }]}
          >
            {photoUri ? (
              <>
                <Image source={{ uri: photoUri }} style={styles.photoImg} contentFit="cover" />
                <View style={[styles.retakeBadge, { backgroundColor: colors.primary }]}>
                  <Feather name="camera" size={14} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 12 }}>Retake</Text>
                </View>
              </>
            ) : (
              <View style={styles.photoEmpty}>
                <View style={[styles.photoIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="camera" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.photoTitle, { color: colors.foreground }]}>Capture cut plant</Text>
                <Text style={[styles.photoSub, { color: colors.mutedForeground }]}>Stalk / base clearly visible</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Mandatory inputs */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ gap: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Basic Inputs</Text>
            <View style={[styles.reqBadge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.reqText, { color: colors.primary }]}>Required</Text>
            </View>
          </View>
          <View style={[styles.obsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <ObsRow
              label="Harvest Method"
              options={["Manual", "Machine"]}
              value={harvestMethod}
              onChange={(v) => setHarvestMethod(v as HarvestMethod)}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ObsRow
              label="Crop Condition at Cut"
              options={["Green", "Dry", "Mixed"]}
              value={cropCondition}
              onChange={(v) => setCropCondition(v as CropCondition)}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Optional inputs */}
        <Animated.View entering={FadeInDown.delay(160).duration(300)} style={{ gap: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Optional</Text>
          </View>
          <View style={[styles.obsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <ObsRow
              label="Cutting Height"
              options={["Low", "Medium", "High"]}
              value={cuttingHeight}
              onChange={(v) => setCuttingHeight(v as CuttingHeight)}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ObsRow
              label="Lodging (Fallen Plants)"
              options={["None", "Some", "Heavy"]}
              value={lodging}
              onChange={(v) => setLodging(v as Lodging)}
              colors={colors}
            />
          </View>
          <Text style={[styles.obsHint, { color: colors.mutedForeground }]}>Optional — can be skipped</Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {!canSave && (
          <Text style={[styles.saveHint, { color: colors.mutedForeground }]}>
            {!photoUri ? "Take a photo to continue" : "Select harvest method & crop condition"}
          </Text>
        )}
        <Button
          title="Save Cut Record"
          onPress={save}
          disabled={!canSave || saving}
          loading={saving}
          icon={<Feather name="check" size={20} color={colors.primaryForeground} />}
        />
      </View>
    </View>
  );
}

function ObsRow({ label, options, value, onChange, colors }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; colors: any;
}) {
  return (
    <View style={styles.obsRow}>
      <Text style={[styles.obsLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map((o) => {
          const sel = value === o;
          return (
            <TouchableOpacity
              key={o}
              onPress={() => { Haptics.selectionAsync(); onChange(sel ? "" : o); }}
              activeOpacity={0.85}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primary : colors.background }}
            >
              <Text style={{ color: sel ? colors.primaryForeground : colors.foreground, fontWeight: "700", fontSize: 13 }}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  content: { padding: 16, gap: 20 },
  zoneStrip: { padding: 14 },
  stripLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  zoneThumb: { width: "100%", aspectRatio: 1, borderRadius: 8 },
  zoneLabel: { fontSize: 11, fontWeight: "600" },
  sectionLabel: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  reqBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  reqText: { fontSize: 10, fontWeight: "800" },
  photoCard: { borderWidth: 2, borderStyle: "dashed", overflow: "hidden", minHeight: 200, position: "relative" },
  photoEmpty: { padding: 40, alignItems: "center", gap: 10 },
  photoIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  photoTitle: { fontSize: 16, fontWeight: "700" },
  photoSub: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  photoImg: { width: "100%", height: 240 },
  retakeBadge: { position: "absolute", bottom: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  obsCard: { borderWidth: 1, overflow: "hidden" },
  obsRow: { padding: 14, gap: 10 },
  obsLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  divider: { height: 1 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  obsHint: { fontSize: 12, fontWeight: "500", marginTop: 8, textAlign: "center" },
  saveHint: { fontSize: 12, fontWeight: "600", textAlign: "center", marginBottom: 6 },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
});
