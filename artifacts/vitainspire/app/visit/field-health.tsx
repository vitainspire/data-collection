import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useColors } from "@/hooks/useColors";
import { useVisitContext } from "./_layout";

export default function FieldHealthScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateData } = useVisitContext();
  const h = data.overallHealth;
  const set = (k: keyof typeof h, v: string) => updateData({ overallHealth: { ...h, [k]: v } });

  const Row = ({
    icon,
    iconColor,
    title,
    children,
  }: {
    icon: string;
    iconColor: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={styles.rowHead}>
        <View style={[styles.iconWrap, { backgroundColor: iconColor + "22" }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
        </View>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Overall Field Health" subtitle="Step 3 of 4 · Whole-field signals" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Row icon="sprout" iconColor="#10b981" title="Plant stand">
          <SegmentedControl
            options={[
              { label: "Good", value: "Good" },
              { label: "Medium", value: "Medium" },
              { label: "Poor", value: "Poor" },
            ]}
            value={h.plantStand}
            onChange={(v) => set("plantStand", v)}
          />
        </Row>

        <Row icon="bug" iconColor="#e07a5f" title="Pest pressure">
          <SegmentedControl
            options={[
              { label: "None", value: "None" },
              { label: "Mild", value: "Mild" },
              { label: "Severe", value: "Severe" },
            ]}
            value={h.pestPressure}
            onChange={(v) => set("pestPressure", v)}
          />
        </Row>

        <Row icon="virus" iconColor="#a855f7" title="Disease seen">
          <SegmentedControl
            options={[
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
            ]}
            value={h.diseaseSeen}
            onChange={(v) => set("diseaseSeen", v)}
          />
        </Row>

        <Row icon="weather-pouring" iconColor="#3b82f6" title="Rainfall pattern">
          <SegmentedControl
            options={[
              { label: "Adequate", value: "Adequate" },
              { label: "Low", value: "Low" },
              { label: "Excess", value: "Excess" },
            ]}
            value={h.rainfallPattern}
            onChange={(v) => set("rainfallPattern", v)}
          />
        </Row>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Continue to Photos"
          icon={<Feather name="camera" size={20} color={colors.primaryForeground} />}
          onPress={() => router.push("/visit/photos")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 12 },
  row: { padding: 16, borderWidth: 1, gap: 12 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
