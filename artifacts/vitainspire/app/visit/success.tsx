import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";

export default function VisitSuccessScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: "#10b981" }]}>
        <Feather name="check" size={56} color="#fff" />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Field visit saved</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Your visit has been recorded with the auto-generated field ID below.
      </Text>

      <View style={[styles.idBox, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
        <MaterialCommunityIcons name="identifier" size={22} color={colors.primary} />
        <Text style={[styles.idText, { color: colors.primary }]}>{id}</Text>
      </View>

      <View style={{ width: "100%", gap: 10, marginTop: 16 }}>
        <Button
          title="Back to Harvest"
          icon={<Feather name="home" size={20} color={colors.primaryForeground} />}
          onPress={() => router.replace("/(tabs)")}
        />
        <Button
          title="Start Another Visit"
          variant="outline"
          onPress={() => router.replace("/visit/field-acres")}
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
    padding: 32,
    gap: 12,
    paddingBottom: Platform.OS === "web" ? 80 : 40,
  },
  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "800" },
  sub: { fontSize: 14, textAlign: "center", marginBottom: 16 },
  idBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    paddingHorizontal: 24,
  },
  idText: { fontSize: 22, fontWeight: "800", letterSpacing: 1 },
});
