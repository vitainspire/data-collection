import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useSilageContext } from "./_layout";

const OPTIONS = [
  { value: "<4.2", label: "Below 4.2", hint: "Good fermentation", color: "#10b981", icon: "check-circle" },
  { value: "4.2-4.8", label: "4.2 to 4.8", hint: "Marginal", color: "#f59e0b", icon: "alert-triangle" },
  { value: ">4.8", label: "Above 4.8", hint: "Poor / spoiled", color: "#ef4444", icon: "x-circle" },
] as const;

export default function PhScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateData } = useSilageContext();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="pH Reading" subtitle="Step 9 · Use pH strip" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.banner, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Feather name="droplet" size={18} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>
            Insert pH strip into a small juice extract from the sample. Wait 10 seconds.
          </Text>
        </View>

        {OPTIONS.map((o) => {
          const sel = data.pH === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                updateData({ pH: o.value });
              }}
              style={[
                styles.opt,
                {
                  backgroundColor: sel ? o.color : colors.card,
                  borderColor: sel ? o.color : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name={o.icon as any} size={26} color={sel ? "#fff" : o.color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.optLabel, { color: sel ? "#fff" : colors.foreground }]}>{o.label}</Text>
                <Text style={[styles.optHint, { color: sel ? "#fff" : colors.mutedForeground, opacity: sel ? 0.9 : 1 }]}>
                  {o.hint}
                </Text>
              </View>
              {sel && <Feather name="check" size={22} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Continue"
          disabled={!data.pH}
          icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          onPress={() => router.push("/silage/sensory")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 12 },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, marginBottom: 8 },
  bannerText: { flex: 1, fontWeight: "600", fontSize: 13 },
  opt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderWidth: 2,
  },
  optLabel: { fontSize: 16, fontWeight: "800" },
  optHint: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
