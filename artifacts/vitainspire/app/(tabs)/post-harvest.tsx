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

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";

const GRADE_COLORS: Record<string, string> = {
  A: "#10b981",
  B: "#f59e0b",
  C: "#ef4444",
};

export default function PostHarvestScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { silageSamples, fieldVisits, refresh } = useStore();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 90;

  const startSample = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (fieldVisits.length === 0) {
      router.push("/silage/start");
    } else {
      router.push("/silage/start");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <View style={[styles.brandIcon, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons name="silo" size={22} color={colors.accentForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brand, { color: colors.foreground }]}>Post-Harvest</Text>
          <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>
            Silage sample collection
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={startSample}
        activeOpacity={0.85}
        style={[styles.captureCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
      >
        <View style={styles.captureIcon}>
          <MaterialCommunityIcons name="test-tube" size={28} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.captureTitle, { color: colors.primaryForeground }]}>
            Start New Silage Sample
          </Text>
          <Text style={[styles.captureSub, { color: colors.primaryForeground, opacity: 0.85 }]}>
            10-minute guided collection flow
          </Text>
        </View>
        <Feather name="chevron-right" size={22} color={colors.primaryForeground} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
        Silage Batches ({silageSamples.length})
      </Text>

      {silageSamples.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="flask-empty-outline" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No silage samples yet. Start one above.
          </Text>
        </View>
      ) : (
        silageSamples.map((s) => (
          <View
            key={s.sampleId}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <View
              style={[
                styles.gradeBadge,
                { backgroundColor: GRADE_COLORS[s.grade] || colors.mutedForeground },
              ]}
            >
              <Text style={styles.gradeText}>{s.grade || "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sampleId, { color: colors.foreground }]} numberOfLines={1}>
                {s.sampleId}
              </Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {s.context.crop} · pH {s.pH} · {new Date(s.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {s.needsReview && (
              <Feather name="flag" size={16} color={colors.destructive} />
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  brandSub: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  captureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  captureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureTitle: { fontSize: 17, fontWeight: "700" },
  captureSub: { fontSize: 13, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  gradeBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  sampleId: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: "center", padding: 32, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: "500" },
});
