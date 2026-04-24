import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/Button";
import { StatusChecklist } from "@/components/StatusChecklist";

export default function FieldCaptureScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { farmer, fields, refresh } = useStore();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 110 : 100;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 8, paddingBottom: bottomPad },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header / farmer bar */}
      <View style={styles.brandRow}>
        <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="leaf" size={22} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brand, { color: colors.foreground }]}>Vitainspire</Text>
          <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>
            Smart Farming. Better Yield.
          </Text>
        </View>
        {farmer && (
          <View style={[styles.farmerBadge, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
            {farmer.photoUri ? (
              <Image source={{ uri: farmer.photoUri }} style={styles.farmerImg} contentFit="cover" />
            ) : (
              <View style={[styles.farmerImg, { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>
                  {farmer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Hero start card */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/field/new");
        }}
        activeOpacity={0.9}
        style={[
          styles.heroCard,
          { backgroundColor: colors.primary, borderRadius: colors.radius },
        ]}
      >
        <View style={styles.heroIcon}>
          <Feather name="plus" size={28} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>
            Start New Field
          </Text>
          <Text style={[styles.heroSub, { color: colors.primaryForeground, opacity: 0.85 }]}>
            Capture standing crop and create a Field ID
          </Text>
        </View>
        <Feather name="chevron-right" size={22} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Field list */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Your Fields ({fields.length})
      </Text>

      {fields.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="sprout-outline" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No fields yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap &ldquo;Start New Field&rdquo; above to begin
          </Text>
        </View>
      ) : (
        fields.map((f) => (
          <View
            key={f.id}
            style={[
              styles.fieldCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.fieldHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldId, { color: colors.foreground }]}>{f.id}</Text>
                <Text style={[styles.fieldMeta, { color: colors.mutedForeground }]}>
                  {f.cropType} · {f.area || "—"} acres ·{" "}
                  {new Date(f.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {f.standing.plantUri && (
                <Image source={{ uri: f.standing.plantUri }} style={styles.fieldThumb} contentFit="cover" />
              )}
            </View>
            <StatusChecklist field={f} compact />
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 8 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  brandSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  farmerBadge: {
    width: 44,
    height: 44,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  farmerImg: { width: 44, height: 44 },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
    marginBottom: 22,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 18, fontWeight: "800" },
  heroSub: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 6,
    marginBottom: 12,
  },
  empty: {
    padding: 32,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  fieldCard: {
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  fieldId: { fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  fieldMeta: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  fieldThumb: { width: 52, height: 52, borderRadius: 8 },
});
