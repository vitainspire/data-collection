import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useSilageContext } from "./_layout";

export default function EligibilityScreen() {
  const colors = useColors();
  const router = useRouter();
  const { updateData } = useSilageContext();
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);

  const Item = ({ on, set, label, icon }: any) => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        set(!on);
      }}
      activeOpacity={0.85}
      style={[
        styles.item,
        {
          backgroundColor: on ? colors.primary : colors.card,
          borderColor: on ? colors.primary : colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={[styles.checkbox, { borderColor: on ? colors.primaryForeground : colors.border, backgroundColor: on ? colors.primaryForeground : "transparent" }]}>
        {on && <Feather name="check" size={16} color={colors.primary} />}
      </View>
      <Feather name={icon} size={20} color={on ? colors.primaryForeground : colors.foreground} />
      <Text style={{ flex: 1, fontWeight: "700", color: on ? colors.primaryForeground : colors.foreground }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const reject = (label: string) => (
    <View style={styles.rejectRow}>
      <Feather name="x" size={14} color={colors.destructive} />
      <Text style={[styles.rejectText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Eligibility Check" subtitle="Step 2 · Confirm sample qualifies" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Is this silage?</Text>

        <Item on={a} set={setA} label="45+ days fermented" icon="clock" />
        <Item on={b} set={setB} label="Freshly opened OR feeding" icon="package" />

        <Text style={[styles.heading, { color: colors.destructive, marginTop: 24 }]}>Reject if</Text>
        <View style={[styles.rejectCard, { backgroundColor: colors.destructive + "11", borderRadius: colors.radius }]}>
          {reject("Fresh fodder")}
          {reject("Less than 30 days fermented")}
          {reject("Standing crop")}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Confirm Eligible"
          disabled={!(a && b)}
          icon={<Feather name="check-circle" size={20} color={colors.primaryForeground} />}
          onPress={() => {
            updateData({ eligibilityConfirmed: true });
            router.push("/silage/collect");
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 12 },
  heading: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderWidth: 2,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectCard: { padding: 14, gap: 8 },
  rejectRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rejectText: { fontSize: 13, fontWeight: "500" },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
