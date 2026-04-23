import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";
import { useVisitContext } from "./_layout";

const STATES = [
  { code: "AP", name: "Andhra Pradesh", districts: ["KNL", "GTR", "ANR"] },
  { code: "TN", name: "Tamil Nadu", districts: ["CHN", "CBE", "MDU"] },
  { code: "KA", name: "Karnataka", districts: ["BLR", "MYS", "MNG"] },
  { code: "MH", name: "Maharashtra", districts: ["PUN", "NGP", "NSK"] },
  { code: "PB", name: "Punjab", districts: ["LDH", "AMR", "JLD"] },
];

const CROPS = [
  { value: "Maize", icon: "corn" },
  { value: "Rice", icon: "rice" },
  { value: "Wheat", icon: "barley" },
  { value: "Sugarcane", icon: "sprout" },
  { value: "Cotton", icon: "flower-tulip" },
] as const;

export default function FieldAcresScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateData } = useVisitContext();

  const [walkerOpen, setWalkerOpen] = useState(false);
  const [walkerPoints, setWalkerPoints] = useState<{ x: number; y: number }[]>([]);
  const [stateModalOpen, setStateModalOpen] = useState(false);

  const currentState = STATES.find((s) => s.code === data.state) || STATES[0];

  const computeArea = () => {
    if (walkerPoints.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < walkerPoints.length; i++) {
      const j = (i + 1) % walkerPoints.length;
      area += walkerPoints[i].x * walkerPoints[j].y;
      area -= walkerPoints[j].x * walkerPoints[i].y;
    }
    return Math.abs(area / 2 / 100).toFixed(2);
  };

  const finishWalker = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const acres = computeArea();
    updateData({ fieldArea: String(acres) });
    setWalkerOpen(false);
    setWalkerPoints([]);
  };

  const canContinue = data.fieldArea.trim().length > 0 && parseFloat(data.fieldArea) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="New Field Visit" subtitle="Step 1 of 4 · Field details" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.foreground }]}>Location</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setStateModalOpen(true)}
          style={[
            styles.locationRow,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <MaterialCommunityIcons name="map-marker" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.locText, { color: colors.foreground }]}>
              {currentState.name} · {data.district}
            </Text>
            <Text style={[styles.locSub, { color: colors.mutedForeground }]}>
              Used to auto-generate field ID
            </Text>
          </View>
          <Feather name="edit-2" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.foreground, marginTop: 24 }]}>
          Field area (acres)
        </Text>
        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <TextInput
            value={data.fieldArea}
            onChangeText={(t) => updateData({ fieldArea: t.replace(/[^0-9.]/g, "") })}
            placeholder="e.g. 2.5"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.foreground }]}
          />
          <Text style={[styles.suffix, { color: colors.mutedForeground }]}>acres</Text>
        </View>

        <Button
          title="Use Acre Walker"
          variant="outline"
          size="md"
          icon={<MaterialCommunityIcons name="walk" size={20} color={colors.primary} />}
          onPress={() => {
            setWalkerPoints([]);
            setWalkerOpen(true);
          }}
          style={{ marginTop: 12 }}
        />

        <Text style={[styles.label, { color: colors.foreground, marginTop: 28 }]}>Crop type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
          {CROPS.map((c) => {
            const selected = data.cropType === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateData({ cropType: c.value });
                }}
                activeOpacity={0.85}
                style={[
                  styles.cropChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={c.icon as any}
                  size={22}
                  color={selected ? colors.primaryForeground : colors.primary}
                />
                <Text
                  style={[
                    styles.cropText,
                    { color: selected ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {c.value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Next"
          disabled={!canContinue}
          icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          onPress={() => router.push("/visit/field-walk")}
        />
      </View>

      {/* Acre Walker Modal */}
      <Modal visible={walkerOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Acre Walker</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Tap each corner of your field as you walk. Min 3 points.
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setWalkerPoints((p) => [
                  ...p,
                  { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY },
                ]);
              }}
              style={[
                styles.walkerCanvas,
                { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius },
              ]}
            >
              {walkerPoints.map((p, i) => (
                <View
                  key={i}
                  style={[
                    styles.point,
                    { left: p.x - 8, top: p.y - 8, backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.pointText}>{i + 1}</Text>
                </View>
              ))}
              {walkerPoints.length === 0 && (
                <View style={styles.canvasEmpty}>
                  <MaterialCommunityIcons name="hand-pointing-up" size={32} color={colors.mutedForeground} />
                  <Text style={{ color: colors.mutedForeground, fontWeight: "600", marginTop: 8 }}>
                    Tap to log corners
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.walkerStats}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {walkerPoints.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>points</Text>
              <View style={{ width: 1, height: 24, backgroundColor: colors.border, marginHorizontal: 16 }} />
              <Text style={[styles.statValue, { color: colors.primary }]}>{computeArea()}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>acres (est)</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setWalkerOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Use Area"
                size="md"
                disabled={walkerPoints.length < 3}
                onPress={finishWalker}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* State / District Modal */}
      <Modal visible={stateModalOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Location</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {STATES.map((s) => (
                <View key={s.code}>
                  <Text style={[styles.stateHeader, { color: colors.foreground }]}>{s.name}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {s.districts.map((d) => {
                      const sel = data.state === s.code && data.district === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            updateData({ state: s.code, district: d });
                            setStateModalOpen(false);
                          }}
                          style={[
                            styles.districtChip,
                            {
                              backgroundColor: sel ? colors.primary : colors.secondary,
                              borderRadius: colors.radius,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: sel ? colors.primaryForeground : colors.foreground,
                              fontWeight: "600",
                            }}
                          >
                            {s.code}-{d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
            <Button
              title="Close"
              variant="outline"
              size="md"
              onPress={() => setStateModalOpen(false)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  locText: { fontSize: 15, fontWeight: "700" },
  locSub: { fontSize: 12, marginTop: 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    height: 56,
    gap: 8,
  },
  input: { flex: 1, fontSize: 18, fontWeight: "700" },
  suffix: { fontSize: 14, fontWeight: "600" },
  cropChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
  },
  cropText: { fontWeight: "700", fontSize: 14 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 16 },
  walkerCanvas: {
    height: 260,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  canvasEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  point: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pointText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  walkerStats: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginTop: 16,
  },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 13, marginLeft: 4, fontWeight: "500" },
  stateHeader: { fontSize: 14, fontWeight: "700", marginTop: 12, marginBottom: 8 },
  districtChip: { paddingHorizontal: 14, paddingVertical: 10 },
});
