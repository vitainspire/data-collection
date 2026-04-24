import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/Button";
import { StatusChecklist } from "@/components/StatusChecklist";

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

export default function HarvestTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fields, updateField, refresh } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const eligibleFields = fields.filter((f) => f.standing.plantUri);
  const selected = eligibleFields.find((f) => f.id === selectedId) ?? null;

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
      <Text style={[styles.h1, { color: colors.foreground }]}>Harvest</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Continue an existing field by capturing cut and chopped material.
      </Text>

      {/* Field selector */}
      <Text style={[styles.section, { color: colors.foreground }]}>1. Select a field</Text>
      {eligibleFields.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="leaf-off" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No standing fields yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Create a field in &ldquo;Field Capture&rdquo; first
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
        >
          {eligibleFields.map((f) => {
            const isSelected = f.id === selectedId;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedId(f.id);
                }}
                activeOpacity={0.85}
                style={[
                  styles.fieldChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isSelected ? colors.primaryForeground : colors.foreground,
                    fontWeight: "800",
                    fontSize: 14,
                    letterSpacing: 0.4,
                  }}
                >
                  {f.id}
                </Text>
                <Text
                  style={{
                    color: isSelected ? colors.primaryForeground : colors.mutedForeground,
                    fontSize: 11,
                    fontWeight: "600",
                    marginTop: 2,
                    opacity: isSelected ? 0.85 : 1,
                  }}
                >
                  {f.cropType}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selected && (
        <Animated.View entering={FadeIn.duration(250)}>
          <Text style={[styles.section, { color: colors.foreground }]}>2. Progress</Text>
          <View
            style={[
              styles.progressCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.progressHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldId, { color: colors.foreground }]}>{selected.id}</Text>
                <Text style={[styles.fieldMeta, { color: colors.mutedForeground }]}>
                  {selected.cropType} · {selected.area || "—"} acres
                </Text>
              </View>
            </View>
            <StatusChecklist field={selected} />
          </View>

          <Text style={[styles.section, { color: colors.foreground }]}>3. Capture stages</Text>

          {/* Cut */}
          <View
            style={[
              styles.stageCard,
              {
                backgroundColor: colors.card,
                borderColor: selected.cut ? colors.primary : colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.stageHeader}>
              <View style={[styles.stageIcon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="content-cut" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stageTitle, { color: colors.foreground }]}>Cut Plant</Text>
                <Text style={[styles.stageSub, { color: colors.mutedForeground }]}>
                  {selected.cut
                    ? `Captured ${new Date(selected.cut.capturedAt).toLocaleString()}`
                    : "Photograph the freshly cut crop"}
                </Text>
              </View>
            </View>
            {selected.cut?.uri && (
              <Image source={{ uri: selected.cut.uri }} style={styles.stageImg} contentFit="cover" />
            )}
            <Button
              title={selected.cut ? "Retake Cut Photo" : "Capture Cut Plant"}
              variant={selected.cut ? "outline" : "primary"}
              icon={<Feather name="camera" size={18} color={selected.cut ? colors.primary : colors.primaryForeground} />}
              onPress={captureCut}
            />
          </View>

          {/* Chopped */}
          <View
            style={[
              styles.stageCard,
              {
                backgroundColor: colors.card,
                borderColor: selected.chopped ? colors.primary : colors.border,
                borderRadius: colors.radius,
                opacity: selected.cut ? 1 : 0.55,
              },
            ]}
          >
            <View style={styles.stageHeader}>
              <View style={[styles.stageIcon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="grain" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stageTitle, { color: colors.foreground }]}>Chopped Material</Text>
                <Text style={[styles.stageSub, { color: colors.mutedForeground }]}>
                  {selected.chopped
                    ? `Captured ${new Date(selected.chopped.capturedAt).toLocaleString()}`
                    : selected.cut
                    ? "Photograph after chopping"
                    : "Capture Cut first"}
                </Text>
              </View>
            </View>
            {selected.chopped?.uri && (
              <Image source={{ uri: selected.chopped.uri }} style={styles.stageImg} contentFit="cover" />
            )}
            <Button
              title={selected.chopped ? "Retake Chopped Photo" : "Capture Chopped Material"}
              variant={selected.chopped ? "outline" : "primary"}
              icon={<Feather name="camera" size={18} color={selected.chopped ? colors.primary : colors.primaryForeground} />}
              onPress={captureChopped}
              disabled={!selected.cut}
            />
          </View>
        </Animated.View>
      )}
    </ScrollView>
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
    minWidth: 130,
  },
  progressCard: { padding: 14, borderWidth: 1, gap: 12 },
  progressHeader: { flexDirection: "row", alignItems: "center" },
  fieldId: { fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  fieldMeta: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  stageCard: { padding: 14, borderWidth: 2, marginBottom: 12, gap: 12 },
  stageHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  stageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stageTitle: { fontSize: 15, fontWeight: "700" },
  stageSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  stageImg: { width: "100%", height: 140, borderRadius: 8 },
});
