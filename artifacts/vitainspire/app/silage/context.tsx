import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useColors } from "@/hooks/useColors";
import { useSilageContext } from "./_layout";

export default function ContextScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateData } = useSilageContext();
  const c = data.context;
  const set = (k: keyof typeof c, v: string) => updateData({ context: { ...c, [k]: v } });

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
      <Header title="Context Data" subtitle="Step 11 · Silage background" />
      <ScrollView contentContainerStyle={styles.content}>
        <Row icon="corn" color="#f59e0b" title="Crop type">
          <SegmentedControl
            options={[
              { label: "Maize", value: "Maize" },
              { label: "Sorghum", value: "Sorghum" },
              { label: "Other", value: "Other" },
            ]}
            value={c.crop}
            onChange={(v) => set("crop", v)}
          />
        </Row>

        <Row icon="silo" color="#1b4332" title="Storage type">
          <SegmentedControl
            options={[
              { label: "Pit", value: "Pit" },
              { label: "Bag", value: "Bag" },
              { label: "Bunker", value: "Bunker" },
            ]}
            value={c.storage}
            onChange={(v) => set("storage", v)}
          />
        </Row>

        <Row icon="calendar-clock" color="#3b82f6" title="Age (days)">
          <SegmentedControl
            options={[
              { label: "30-45", value: "30-45" },
              { label: "45-60", value: "45-60" },
              { label: "60+", value: "60+" },
            ]}
            value={c.age}
            onChange={(v) => set("age", v)}
          />
        </Row>

        <Row icon="weather-partly-cloudy" color="#a855f7" title="Recent weather">
          <SegmentedControl
            options={[
              { label: "Dry", value: "Dry" },
              { label: "Mixed", value: "Mixed" },
              { label: "Wet", value: "Wet" },
            ]}
            value={c.weather}
            onChange={(v) => set("weather", v)}
          />
        </Row>

        <Row icon="cow" color="#e07a5f" title="Feeding status">
          <SegmentedControl
            options={[
              { label: "Just Opened", value: "Just Opened" },
              { label: "Mid-feed", value: "Mid-feed" },
              { label: "Almost Done", value: "Almost Done" },
            ]}
            value={c.feedingStatus}
            onChange={(v) => set("feedingStatus", v)}
          />
        </Row>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="See Auto-Grade"
          icon={<Feather name="award" size={20} color={colors.primaryForeground} />}
          onPress={() => router.push("/silage/grade")}
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
