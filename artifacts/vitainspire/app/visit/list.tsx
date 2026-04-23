import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Header } from "@/components/Header";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";

export default function VisitListScreen() {
  const colors = useColors();
  const { fieldVisits, refresh } = useStore();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Recorded Harvests" subtitle={`${fieldVisits.length} field visits`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {fieldVisits.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-off-outline" size={42} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No field visits recorded yet.
            </Text>
          </View>
        ) : (
          fieldVisits.map((v) => (
            <View
              key={v.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <View style={styles.cardHead}>
                <Text style={[styles.idText, { color: colors.primary }]}>{v.id}</Text>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>
                  {new Date(v.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.meta, { color: colors.foreground }]}>
                {v.cropType} · {v.fieldArea} acres
              </Text>
              <View style={styles.statsRow}>
                <Stat colors={colors} label="Stand" value={v.overallHealth.plantStand} />
                <Stat colors={colors} label="Pest" value={v.overallHealth.pestPressure} />
                <Stat colors={colors} label="Disease" value={v.overallHealth.diseaseSeen} />
                <Stat colors={colors} label="Rain" value={v.overallHealth.rainfallPattern} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ colors, label, value }: any) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.secondary, borderRadius: 8 }]}>
      <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "700", textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: Platform.OS === "web" ? 80 : 32, gap: 12 },
  empty: { alignItems: "center", padding: 48, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "500" },
  card: { padding: 16, borderWidth: 1, gap: 8 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  idText: { fontSize: 16, fontWeight: "800" },
  date: { fontSize: 12, fontWeight: "500" },
  meta: { fontSize: 14, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  stat: { paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
});
