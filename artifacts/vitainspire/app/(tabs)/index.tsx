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
import { useStore, type Field, type FieldStatus } from "@/hooks/useStore";

const STATUS_CONFIG: Record<FieldStatus, { label: string; bg: string; fg: string; next: string | null; action: string }> = {
  standing: { label: "Standing",  bg: "#16a34a22", fg: "#15803d", next: "cut",     action: "Record Cut →"     },
  cut:      { label: "Cut",       bg: "#f59e0b22", fg: "#d97706", next: "chopped", action: "Record Chopped →" },
  chopped:  { label: "Chopped",   bg: "#8b5cf622", fg: "#7c3aed", next: null,      action: "Complete ✓"       },
  silage:   { label: "Silage",    bg: "#64748b22", fg: "#475569", next: null,      action: "Complete ✓"       },
};

export default function FieldCaptureScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { farmer, fields, refresh } = useStore();

  useFocusEffect(
    useCallback(() => { refresh(); }, [refresh])
  );

  const bottomPad = Platform.OS === "web" ? 110 : 100;

  const handleFieldTap = (f: Field) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cfg = STATUS_CONFIG[f.status];
    if (f.status === "standing") {
      router.push(`/field/cut?fieldId=${f.id}`);
    } else if (f.status === "cut") {
      router.push(`/field/chopped?fieldId=${f.id}`);
    }
    // chopped / silage: no further action
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: 16, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand header */}
      <View style={styles.brandRow}>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace("/home"); }}
          activeOpacity={0.7}
          style={[styles.backBtn, { backgroundColor: colors.secondary }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="leaf" size={22} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brand, { color: colors.foreground }]}>Vitainspire</Text>
          <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>Smart Farming. Better Yield.</Text>
        </View>
        {farmer && (
          <View style={[styles.farmerBadge, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
            {farmer.photoUri ? (
              <Image source={{ uri: farmer.photoUri }} style={styles.farmerAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.farmerAvatar, { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>
                  {farmer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Start New Field */}
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/field/new"); }}
        activeOpacity={0.9}
        style={[styles.heroCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
      >
        <View style={styles.heroIcon}>
          <Feather name="plus" size={26} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Start New Field</Text>
          <Text style={[styles.heroSub, { color: colors.primaryForeground, opacity: 0.82 }]}>
            Register a field · capture zone data
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Pipeline legend */}
      {fields.length > 0 && (
        <View style={[styles.pipeline, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          {(["standing", "cut", "chopped"] as FieldStatus[]).map((s, i) => {
            const cfg = STATUS_CONFIG[s];
            const count = fields.filter((f) => f.status === s).length;
            return (
              <React.Fragment key={s}>
                {i > 0 && <Feather name="arrow-right" size={14} color={colors.mutedForeground} />}
                <View style={{ alignItems: "center", gap: 4 }}>
                  <View style={[styles.pipelineDot, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.pipelineCount, { color: cfg.fg }]}>{count}</Text>
                  </View>
                  <Text style={[styles.pipelineLabel, { color: colors.mutedForeground }]}>{cfg.label}</Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      )}

      {/* Records */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {fields.length === 0 ? "Records" : `Records (${fields.length})`}
      </Text>

      {fields.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="sprout-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No fields yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap "Start New Field" above to begin
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {fields.map((f) => {
            const cfg = STATUS_CONFIG[f.status];
            const thumb = f.zones?.A?.plantUri ?? f.standing?.plantUri ?? null;
            const isActionable = f.status === "standing" || f.status === "cut";
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => handleFieldTap(f)}
                activeOpacity={isActionable ? 0.88 : 1}
                style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
              >
                {/* Top row */}
                <View style={styles.fieldCardTop}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[styles.fieldId, { color: colors.foreground }]}>{f.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.statusText, { color: cfg.fg }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    <Text style={[styles.fieldMeta, { color: colors.mutedForeground }]}>
                      {f.cropType}
                      {f.area ? ` · ${f.area} acres` : ""}
                      {` · ${new Date(f.createdAt).toLocaleDateString()}`}
                    </Text>
                  </View>
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.fieldThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.fieldThumb, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="image" size={18} color={colors.mutedForeground} />
                    </View>
                  )}
                </View>

                {/* Stage progress */}
                <View style={styles.stageRow}>
                  {(["standing", "cut", "chopped"] as FieldStatus[]).map((s, i) => {
                    const done = ["standing","cut","chopped"].indexOf(f.status) >= i;
                    const active = f.status === s;
                    const stageCfg = STATUS_CONFIG[s];
                    return (
                      <React.Fragment key={s}>
                        {i > 0 && (
                          <View style={[styles.stageLine, { backgroundColor: done && !active ? stageCfg.fg : colors.border }]} />
                        )}
                        <View style={[
                          styles.stageDot,
                          { backgroundColor: done ? stageCfg.fg : colors.border },
                        ]}>
                          {done && <Feather name="check" size={10} color="#fff" />}
                        </View>
                      </React.Fragment>
                    );
                  })}
                </View>

                {/* Action row */}
                {isActionable && (
                  <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.actionText, { color: cfg.fg }]}>{cfg.action}</Text>
                    <Feather name="chevron-right" size={16} color={cfg.fg} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  brandIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  brandSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  farmerBadge: { width: 44, height: 44, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  farmerAvatar: { width: 44, height: 44 },
  heroCard: { flexDirection: "row", alignItems: "center", padding: 18, gap: 14 },
  heroIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 17, fontWeight: "800" },
  heroSub: { fontSize: 12, fontWeight: "500", marginTop: 3 },
  pipeline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 14 },
  pipelineDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  pipelineCount: { fontSize: 15, fontWeight: "800" },
  pipelineLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  sectionTitle: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 4 },
  empty: { padding: 32, alignItems: "center", gap: 8, borderWidth: 1, borderStyle: "dashed" },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  fieldCard: { borderWidth: 1, gap: 0, overflow: "hidden" },
  fieldCardTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  fieldId: { fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
  fieldMeta: { fontSize: 12, fontWeight: "500" },
  fieldThumb: { width: 52, height: 52, borderRadius: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  stageRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12 },
  stageDot: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stageLine: { flex: 1, height: 2, borderRadius: 1 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  actionText: { fontSize: 13, fontWeight: "800" },
});
