import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useSilageContext } from "./_layout";

function computeGrade(d: ReturnType<typeof useSilageContext>["data"]): "A" | "B" | "C" {
  const { pH, sensory } = d;
  if (pH === ">4.8" || sensory.smell === "Foul" || sensory.mold === "Deep" || sensory.temperature === "Hot") return "C";
  if (pH === "<4.2" && sensory.mold === "None" && sensory.smell === "Pleasant") return "A";
  return "B";
}

const GRADES = {
  A: { color: "#10b981", label: "Grade A — Excellent", desc: "Well-fermented, low spoilage risk." },
  B: { color: "#f59e0b", label: "Grade B — Acceptable", desc: "Marginal quality. Watch closely." },
  C: { color: "#ef4444", label: "Grade C — Poor", desc: "Spoilage risk. Consider rejecting." },
};

export default function GradeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateData } = useSilageContext();

  const grade = useMemo(() => computeGrade(data), [data]);
  const meta = GRADES[grade];

  useEffect(() => {
    updateData({ grade });
    Haptics.notificationAsync(
      grade === "A"
        ? Haptics.NotificationFeedbackType.Success
        : grade === "B"
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Error
    );
  }, [grade]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Auto-Graded" subtitle="Step 12 · Computed result" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.bigBadge, { backgroundColor: meta.color, borderRadius: colors.radius }]}>
          <Text style={styles.bigLetter}>{grade}</Text>
        </View>
        <Text style={[styles.gradeLabel, { color: colors.foreground }]}>{meta.label}</Text>
        <Text style={[styles.gradeDesc, { color: colors.mutedForeground }]}>{meta.desc}</Text>

        <View style={[styles.factCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.factTitle, { color: colors.foreground }]}>Inputs used</Text>
          <Fact label="pH" value={data.pH || "—"} colors={colors} />
          <Fact label="Smell" value={data.sensory.smell} colors={colors} />
          <Fact label="Moisture" value={data.sensory.moisture} colors={colors} />
          <Fact label="Mold" value={data.sensory.mold} colors={colors} />
          <Fact label="Temperature" value={data.sensory.temperature} colors={colors} />
        </View>

        <View style={[styles.note, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.foreground }]}>
            You can flag this sample for expert review on the next screen.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Continue to Checklist"
          icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          onPress={() => router.push("/silage/checklist")}
        />
      </View>
    </View>
  );
}

function Fact({ label, value, colors }: any) {
  return (
    <View style={styles.factRow}>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: "600" }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, alignItems: "center", gap: 8 },
  bigBadge: { width: 120, height: 120, alignItems: "center", justifyContent: "center", marginVertical: 12 },
  bigLetter: { fontSize: 72, fontWeight: "900", color: "#fff" },
  gradeLabel: { fontSize: 20, fontWeight: "800" },
  gradeDesc: { fontSize: 14, textAlign: "center", marginBottom: 16 },
  factCard: { width: "100%", padding: 16, borderWidth: 1, gap: 8 },
  factTitle: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  factRow: { flexDirection: "row", justifyContent: "space-between" },
  note: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginTop: 12,
  },
  noteText: { flex: 1, fontSize: 13, fontWeight: "600" },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
