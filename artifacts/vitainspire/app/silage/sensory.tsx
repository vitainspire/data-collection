import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useColors } from "@/hooks/useColors";
import { useSilageContext } from "./_layout";

export default function SensoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateData } = useSilageContext();
  const s = data.sensory;
  const set = (k: keyof typeof s, v: string) => updateData({ sensory: { ...s, [k]: v } });

  const Row = ({ icon, color, title, children }: any) => (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={styles.rowHead}>
        <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Sensory Assessment" subtitle="Step 10 · Smell, feel, look" />
      <ScrollView contentContainerStyle={styles.content}>
        <Row icon="nose" color="#a855f7" title="Smell">
          <SegmentedControl
            options={[
              { label: "Pleasant", value: "Pleasant" },
              { label: "Neutral", value: "Neutral" },
              { label: "Foul", value: "Foul" },
            ]}
            value={s.smell}
            onChange={(v) => set("smell", v)}
          />
        </Row>

        <Row icon="water-percent" color="#3b82f6" title="Moisture">
          <SegmentedControl
            options={[
              { label: "Dry", value: "Dry" },
              { label: "Optimal", value: "Optimal" },
              { label: "Wet", value: "Wet" },
            ]}
            value={s.moisture}
            onChange={(v) => set("moisture", v)}
          />
        </Row>

        <Row icon="mushroom" color="#ef4444" title="Mold">
          <SegmentedControl
            options={[
              { label: "None", value: "None" },
              { label: "Surface", value: "Surface" },
              { label: "Deep", value: "Deep" },
            ]}
            value={s.mold}
            onChange={(v) => set("mold", v)}
          />
        </Row>

        <Row icon="thermometer" color="#f59e0b" title="Temperature">
          <SegmentedControl
            options={[
              { label: "Cool", value: "Cool" },
              { label: "Warm", value: "Warm" },
              { label: "Hot", value: "Hot" },
            ]}
            value={s.temperature}
            onChange={(v) => set("temperature", v)}
          />
        </Row>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Continue"
          icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          onPress={() => router.push("/silage/context")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 12 },
  row: { padding: 16, borderWidth: 1, gap: 12 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "700" },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
