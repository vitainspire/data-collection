import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import { PhotoSlot } from "@/components/PhotoSlot";
import { useColors } from "@/hooks/useColors";
import { useVisitContext } from "./_layout";
import type { ZoneData } from "@/hooks/useStore";

type Zone = "A" | "B" | "C";
const ZONES: { key: Zone; label: string; sub: string; icon: string; color: string }[] = [
  { key: "A", label: "Zone A", sub: "Best area", icon: "trophy", color: "#10b981" },
  { key: "B", label: "Zone B", sub: "Average area", icon: "scale-balance", color: "#f59e0b" },
  { key: "C", label: "Zone C", sub: "Poor area", icon: "alert-circle", color: "#ef4444" },
];

export default function FieldWalkScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateZone } = useVisitContext();
  const [active, setActive] = useState<Zone>("A");

  const zone = data.zones[active];
  const zoneIdx = ZONES.findIndex((z) => z.key === active);
  const meta = ZONES[zoneIdx];

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (active === "A") setActive("B");
    else if (active === "B") setActive("C");
    else router.push("/visit/field-health");
  };

  const setField = (k: keyof ZoneData, v: string) => updateZone(active, { [k]: v } as Partial<ZoneData>);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Guided Field Walk" subtitle="Step 2 of 4 · Three zones" />

      <View style={styles.zoneTabs}>
        {ZONES.map((z) => {
          const sel = z.key === active;
          return (
            <TouchableOpacity
              key={z.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActive(z.key);
              }}
              activeOpacity={0.85}
              style={[
                styles.zoneTab,
                {
                  backgroundColor: sel ? colors.primary : colors.card,
                  borderColor: sel ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View style={[styles.zoneDot, { backgroundColor: z.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800", color: sel ? colors.primaryForeground : colors.foreground }}>
                  {z.label}
                </Text>
                <Text style={{ fontSize: 11, color: sel ? colors.primaryForeground : colors.mutedForeground, opacity: 0.85 }}>
                  {z.sub}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={22} color={meta.color} />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>
            {meta.label} — {meta.sub}
          </Text>
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Photos</Text>
        <PhotoSlot
          uri={zone.plantPhoto}
          onPhotoTaken={(uri) => updateZone(active, { plantPhoto: uri })}
          label="Plant Photo"
          hint="Whole plant, eye level"
        />
        <PhotoSlot
          uri={zone.cobPhoto}
          onPhotoTaken={(uri) => updateZone(active, { cobPhoto: uri })}
          label="Cob Photo"
          hint="Close-up of cob/grain head"
        />

        <Text style={[styles.section, { color: colors.foreground, marginTop: 8 }]}>Quick Observations</Text>

        <Text style={[styles.label, { color: colors.foreground }]}>Plant height</Text>
        <SegmentedControl
          options={[
            { label: "Tall", value: "Tall" },
            { label: "Medium", value: "Medium" },
            { label: "Short", value: "Short" },
          ]}
          value={zone.plantHeight}
          onChange={(v) => setField("plantHeight", v)}
        />

        <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }]}>Plant color</Text>
        <SegmentedControl
          options={[
            { label: "Dark", value: "Dark" },
            { label: "Medium", value: "Medium" },
            { label: "Pale", value: "Pale" },
          ]}
          value={zone.plantColor}
          onChange={(v) => setField("plantColor", v)}
        />

        <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }]}>Stand density</Text>
        <SegmentedControl
          options={[
            { label: "Dense", value: "Dense" },
            { label: "Medium", value: "Medium" },
            { label: "Sparse", value: "Sparse" },
          ]}
          value={zone.standDensity}
          onChange={(v) => setField("standDensity", v)}
        />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title={active === "C" ? "Continue to Field Health" : `Next: Zone ${active === "A" ? "B" : "C"}`}
          icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          onPress={next}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zoneTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  zoneTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderWidth: 2,
  },
  zoneDot: { width: 10, height: 10, borderRadius: 5 },
  content: { padding: 16, paddingBottom: 120, gap: 8 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginBottom: 12,
  },
  bannerText: { fontWeight: "700", fontSize: 14 },
  section: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  footer: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
