import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useSilageContext } from "./_layout";
import { useStore } from "@/hooks/useStore";
import { generateSampleId } from "@/utils/idGenerator";

export default function CollectScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateData } = useSilageContext();
  const { silageSamples } = useStore();

  const generateAndContinue = () => {
    const sampleId = generateSampleId(
      data.fieldId || "AP-KNL-F001",
      silageSamples.map((b) => b.sampleId)
    );
    updateData({ sampleId, sampleCollected: true });
    router.push("/silage/photos");
  };

  const Step = ({ n, title, body, icon }: any) => (
    <View style={[styles.step, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
        <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{body}</Text>
      </View>
      <MaterialCommunityIcons name={icon} size={26} color={colors.primary} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Sample Collection" subtitle="Steps 3-4 · Collect ~500g" />
      <ScrollView contentContainerStyle={styles.content}>
        <Step n={1} title="Discard top layer" body="Remove the spoiled top 6 inches" icon="layers-remove" />
        <Step n={2} title="Take 5 sub-samples" body="From different spots, mix into a clean bag" icon="basket-fill" />
        <Step n={3} title="~500g total" body="Roughly two handfuls" icon="scale" />
        <Step n={4} title="Seal the bag" body="Squeeze out air, label clearly" icon="package-variant-closed" />

        {data.sampleId ? (
          <View style={[styles.idBox, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
            <Feather name="hash" size={18} color={colors.primary} />
            <Text style={[styles.idText, { color: colors.primary }]}>{data.sampleId}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title={data.sampleId ? "Continue" : "Generate Sample ID"}
          icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          onPress={data.sampleId ? () => router.push("/silage/photos") : generateAndContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 12 },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
  },
  stepNum: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: 15, fontWeight: "800" },
  stepBody: { fontSize: 12, marginTop: 2 },
  idBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, marginTop: 8,
  },
  idText: { fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
