import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";

const COLORS = { A: "#10b981", B: "#f59e0b", C: "#ef4444" } as const;

export default function SilageSuccessScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id, grade } = useLocalSearchParams<{ id: string; grade: string }>();
  const g = (grade || "B") as keyof typeof COLORS;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: COLORS[g] }]}>
        <Text style={styles.gradeLetter}>{g}</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Sample submitted</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Saved with grade {g}. The full record is available in Post-Harvest.
      </Text>

      <View style={[styles.idBox, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
        <Feather name="hash" size={20} color={colors.primary} />
        <Text style={[styles.idText, { color: colors.primary }]}>{id}</Text>
      </View>

      <View style={{ width: "100%", gap: 10, marginTop: 16 }}>
        <Button
          title="Back to Post-Harvest"
          icon={<Feather name="home" size={20} color={colors.primaryForeground} />}
          onPress={() => router.replace("/(tabs)/post-harvest")}
        />
        <Button
          title="Collect Another Sample"
          variant="outline"
          onPress={() => router.replace("/silage/start")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32, gap: 12,
    paddingBottom: Platform.OS === "web" ? 80 : 40,
  },
  iconWrap: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  gradeLetter: { fontSize: 64, fontWeight: "900", color: "#fff" },
  title: { fontSize: 24, fontWeight: "800" },
  sub: { fontSize: 14, textAlign: "center", marginBottom: 16 },
  idBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 16, paddingHorizontal: 24,
  },
  idText: { fontSize: 18, fontWeight: "800", letterSpacing: 1 },
});
