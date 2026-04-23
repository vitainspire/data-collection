import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useSilageContext } from "./_layout";
import { useStore } from "@/hooks/useStore";

const ITEMS = [
  "Sample bag sealed and labeled",
  "All 4 photos captured",
  "pH reading recorded",
  "Sensory assessment completed",
  "Context data entered",
  "Storage area photographed",
];

export default function ChecklistScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateData, reset } = useSilageContext();
  const { addSilageSample } = useStore();
  const [checks, setChecks] = useState<boolean[]>(ITEMS.map(() => false));
  const [submitting, setSubmitting] = useState(false);

  const allDone = checks.every(Boolean);

  const submit = async () => {
    setSubmitting(true);
    try {
      await addSilageSample({
        sampleId: data.sampleId,
        fieldId: data.fieldId,
        gps: data.gps,
        photos: data.photos,
        pH: data.pH,
        sensory: data.sensory,
        context: data.context,
        grade: data.grade,
        needsReview: data.needsReview,
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const grade = data.grade;
      const sampleId = data.sampleId;
      reset();
      router.replace({ pathname: "/silage/success", params: { id: sampleId, grade } });
    } catch (e) {
      console.log("submit silage error", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Final Checklist" subtitle="Confirm everything before submitting" />
      <ScrollView contentContainerStyle={styles.content}>
        {ITEMS.map((item, i) => {
          const on = checks[i];
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const n = [...checks];
                n[i] = !n[i];
                setChecks(n);
              }}
              style={[
                styles.item,
                {
                  backgroundColor: on ? colors.primary : colors.card,
                  borderColor: on ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View style={[styles.box, { borderColor: on ? colors.primaryForeground : colors.border, backgroundColor: on ? colors.primaryForeground : "transparent" }]}>
                {on && <Feather name="check" size={14} color={colors.primary} />}
              </View>
              <Text style={{ flex: 1, fontWeight: "600", color: on ? colors.primaryForeground : colors.foreground }}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Haptics.selectionAsync();
            updateData({ needsReview: !data.needsReview });
          }}
          style={[
            styles.flag,
            {
              backgroundColor: data.needsReview ? "#f59e0b" : colors.card,
              borderColor: data.needsReview ? "#f59e0b" : colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="flag" size={18} color={data.needsReview ? "#fff" : colors.foreground} />
          <Text style={{ flex: 1, fontWeight: "700", color: data.needsReview ? "#fff" : colors.foreground }}>
            Flag for expert review
          </Text>
          <View style={[styles.box, { borderColor: data.needsReview ? "#fff" : colors.border, backgroundColor: data.needsReview ? "#fff" : "transparent" }]}>
            {data.needsReview && <Feather name="check" size={14} color="#f59e0b" />}
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title={submitting ? "Saving..." : "Submit Sample"}
          loading={submitting}
          disabled={!allDone}
          icon={<Feather name="check" size={20} color={colors.primaryForeground} />}
          onPress={submit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 10 },
  item: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderWidth: 2,
  },
  box: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  flag: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderWidth: 2, marginTop: 8,
  },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
