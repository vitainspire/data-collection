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
import { syncChoppedToSheet } from "@/utils/sheetSync";
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

type ChopLen = "Fine" | "Medium" | "Coarse" | "";
type Uniformity = "Uniform" | "Mixed" | "Uneven" | "";
type MatQuality = "Good" | "Fair" | "Poor" | "";

export default function ChoppedCaptureScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fieldId } = useLocalSearchParams<{ fieldId: string }>();
  const { fields, updateField, farmer } = useStore();

  const field = fields.find((f) => f.id === fieldId);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [chopLen, setChopLen] = useState<ChopLen>("");
  const [uniformity, setUniformity] = useState<Uniformity>("");
  const [matQuality, setMatQuality] = useState<MatQuality>("");
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;

  const capture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const uri = await pickPhoto();
    if (!uri) return;
    setPhotoUri(uri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const canSave = !!photoUri;

  const save = async () => {
    if (!fieldId || !photoUri) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date().toISOString();
    const by = farmer?.name ?? "Unknown";
    const choppedPatch = {
      status: "chopped" as const,
      chopped: { uri: photoUri, capturedAt: now, capturedBy: by },
      choppedData: { chopLength: chopLen, uniformity, materialQuality: matQuality, capturedBy: by, savedAt: now },
    };
    await updateField(fieldId, choppedPatch);
    if (field) {
      const updatedField = { ...field, ...choppedPatch };
      syncChoppedToSheet(updatedField);
      uploadFieldPhotos(updatedField).catch((e) => console.warn("[drive] chopped upload failed", e));
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Chopped Stage</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {field ? `Field ${field.numericId} · ${field.cropType} · ${field.id}` : fieldId}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: "#8b5cf622" }]}>
          <Text style={[styles.statusText, { color: "#7c3aed" }]}>Chopped</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cut photo reference */}
        {field?.cut?.uri && (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.refCard, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
            <Image source={{ uri: field.cut.uri }} style={styles.refThumb} contentFit="cover" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.refLabel, { color: colors.mutedForeground }]}>Cut photo reference</Text>
              {field.cutData?.yieldEstimate && (
                <Text style={[styles.refValue, { color: colors.foreground }]}>Yield: {field.cutData.yieldEstimate}</Text>
              )}
              {field.cutData?.moistureAtCut && (
                <Text style={[styles.refValue, { color: colors.foreground }]}>Moisture: {field.cutData.moistureAtCut}</Text>
              )}
              {field.cutData?.stubbleHeight && (
                <Text style={[styles.refValue, { color: colors.foreground }]}>Stubble: {field.cutData.stubbleHeight}</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Photo capture */}
        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Chopped Material Photo</Text>
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
                <Text style={[styles.photoTitle, { color: colors.foreground }]}>Capture chopped material</Text>
                <Text style={[styles.photoSub, { color: colors.mutedForeground }]}>Photo of the chopped crop in the field</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Observations */}
        <Animated.View entering={FadeInDown.delay(120).duration(300)} style={{ gap: 0 }}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Chopped Observations</Text>
          <View style={[styles.obsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <ObsRow label="Chop Length" options={["Fine", "Medium", "Coarse"]} value={chopLen} onChange={(v) => setChopLen(v as ChopLen)} colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ObsRow label="Uniformity" options={["Uniform", "Mixed", "Uneven"]} value={uniformity} onChange={(v) => setUniformity(v as Uniformity)} colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ObsRow label="Material Quality" options={["Good", "Fair", "Poor"]} value={matQuality} onChange={(v) => setMatQuality(v as MatQuality)} colors={colors} />
          </View>
          <Text style={[styles.obsHint, { color: colors.mutedForeground }]}>Observations are optional</Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Button
          title="Save Chopped Record"
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
  refCard: { flexDirection: "row", padding: 12, gap: 12, alignItems: "flex-start" },
  refThumb: { width: 72, height: 72, borderRadius: 8 },
  refLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  refValue: { fontSize: 13, fontWeight: "600" },
  sectionLabel: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  photoCard: { borderWidth: 2, borderStyle: "dashed", overflow: "hidden", minHeight: 220, position: "relative" },
  photoEmpty: { padding: 40, alignItems: "center", gap: 10 },
  photoIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  photoTitle: { fontSize: 16, fontWeight: "700" },
  photoSub: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  photoImg: { width: "100%", height: 260 },
  retakeBadge: { position: "absolute", bottom: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  obsCard: { borderWidth: 1, overflow: "hidden" },
  obsRow: { padding: 14, gap: 10 },
  obsLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  divider: { height: 1 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  obsHint: { fontSize: 12, fontWeight: "500", marginTop: 8, textAlign: "center" },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
});
