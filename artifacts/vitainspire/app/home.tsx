import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useStore, type Field, type FieldStatus } from "@/hooks/useStore";

const STATUS_CONFIG: Record<FieldStatus, { label: string; bg: string; fg: string }> = {
  standing: { label: "Standing", bg: "#16a34a22", fg: "#15803d" },
  cut:      { label: "Cut",      bg: "#f59e0b22", fg: "#d97706" },
  chopped:  { label: "Chopped",  bg: "#8b5cf622", fg: "#7c3aed" },
  silage:   { label: "Silage",   bg: "#0891b222", fg: "#0369a1" },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { farmer, fields, refresh } = useStore();

  const [query, setQuery] = useState("");
  const [nearbyIds, setNearbyIds] = useState<string[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 16) : insets.top;

  const searchField = () => {
    const q = query.trim();
    if (!q) return;
    // Match by simple number ("1", "2") OR full field ID ("AP-KNL-001")
    const match = fields.find(
      (f) =>
        String(f.numericId) === q ||
        f.id.toUpperCase() === q.toUpperCase()
    );
    if (match) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/field/${match.id}`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Field not found", `No field "${q}" found on this device.`);
    }
  };

  const showNearby = async () => {
    setNearbyLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location needed", "Allow location access to find nearby fields.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const withDist = fields
        .filter((f) => f.gps)
        .map((f) => ({
          id: f.id,
          km: haversineKm(latitude, longitude, f.gps!.latitude, f.gps!.longitude),
        }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 10);
      setNearbyIds(withDist.map((x) => x.id));
    } finally {
      setNearbyLoading(false);
    }
  };

  const displayedFields = nearbyIds
    ? fields.filter((f) => nearbyIds.includes(f.id)).sort((a, b) => nearbyIds.indexOf(a.id) - nearbyIds.indexOf(b.id))
    : fields;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Brand header */}
      <View style={styles.brandRow}>
        <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="leaf" size={22} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brand, { color: colors.foreground }]}>Vitainspire</Text>
          <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>Data belongs to the field.</Text>
        </View>
        {farmer && (
          <View style={[styles.avatarWrap, { backgroundColor: colors.secondary }]}>
            {farmer.photoUri ? (
              <Image source={{ uri: farmer.photoUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>
                  {farmer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Search */}
      <Animated.View entering={FadeInDown.delay(80).duration(360)}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Find a field</Text>
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchField}
            placeholder="Field number (e.g. 1, 2, 3…)"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={searchField} activeOpacity={0.7}
              style={[styles.searchBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
              <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 13 }}>Go</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Action buttons */}
      <Animated.View entering={FadeInDown.delay(140).duration(360)} style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/field/new"); }}
          activeOpacity={0.88}
          style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
        >
          <Feather name="plus" size={18} color={colors.primaryForeground} />
          <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>New Field</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={showNearby}
          activeOpacity={0.88}
          style={[styles.actionBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius, flex: 0.8 }]}
        >
          {nearbyLoading
            ? <Feather name="loader" size={16} color={colors.foreground} />
            : <Feather name="map-pin" size={16} color={colors.foreground} />}
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Nearby</Text>
        </TouchableOpacity>

        {nearbyIds && (
          <TouchableOpacity onPress={() => setNearbyIds(null)} activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius, flex: 0.5 }]}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
            <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>All</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Field list */}
      <View style={{ gap: 10 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {nearbyIds ? `Nearby fields (${displayedFields.length})` : `All fields (${fields.length})`}
        </Text>

        {displayedFields.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <MaterialCommunityIcons name="sprout-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {nearbyIds ? "No nearby fields found" : "No fields registered yet"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {nearbyIds ? "Try expanding your range" : "Tap New Field to register one"}
            </Text>
          </View>
        )}

        {displayedFields.map((f, i) => (
          <Animated.View key={f.id} entering={FadeInDown.delay(i * 40).duration(300)}>
            <FieldCard field={f} colors={colors} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/field/${f.id}`);
            }} />
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

function FieldCard({ field, colors, onPress }: { field: Field; colors: any; onPress: () => void }) {
  const cfg = STATUS_CONFIG[field.status];
  const thumb = field.zones?.A?.plantUri ?? null;
  const stages: FieldStatus[] = ["standing", "cut", "chopped", "silage"];
  const currentIdx = stages.indexOf(field.status);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}
      style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={styles.fieldCardTop}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[styles.fieldNum, { color: colors.foreground }]}>Field {field.numericId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusText, { color: cfg.fg }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={[styles.fieldIdMeta, { color: colors.mutedForeground }]}>{field.id}</Text>
          <Text style={[styles.fieldMeta, { color: colors.mutedForeground }]}>
            {field.cropType}
            {field.area ? ` · ${field.area} acres` : ""}
            {` · ${field.districtName}, ${field.stateName}`}
          </Text>
          <Text style={[styles.fieldCreated, { color: colors.mutedForeground }]}>
            By {field.createdBy} · {new Date(field.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.fieldThumb} contentFit="cover" />
        ) : (
          <View style={[styles.fieldThumb, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="image" size={16} color={colors.mutedForeground} />
          </View>
        )}
      </View>

      {/* Stage dots */}
      <View style={styles.stageRow}>
        {stages.map((s, i) => {
          const done = i <= currentIdx;
          const scfg = STATUS_CONFIG[s];
          return (
            <React.Fragment key={s}>
              {i > 0 && <View style={[styles.stageLine, { backgroundColor: done ? scfg.fg : colors.border }]} />}
              <View style={[styles.stageDot, { backgroundColor: done ? scfg.fg : colors.border }]}>
                {done && <Feather name="check" size={9} color="#fff" />}
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Next action hint */}
      {field.status !== "silage" && (
        <View style={[styles.nextHint, { borderTopColor: colors.border }]}>
          <Text style={[styles.nextText, { color: cfg.fg }]}>
            {field.status === "standing" ? "Next: Record Cut →"
             : field.status === "cut" ? "Next: Record Chopped →"
             : "Next: Record Silage →"}
          </Text>
          <Feather name="chevron-right" size={14} color={cfg.fg} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  brandSub: { fontSize: 11, fontWeight: "500", marginTop: 1 },
  avatarWrap: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
  avatar: { width: 40, height: 40 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  searchRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, height: 52, overflow: "hidden" },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "600", paddingHorizontal: 10 },
  searchBtn: { marginRight: 6, paddingHorizontal: 16, paddingVertical: 10 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  actionBtnText: { fontSize: 14, fontWeight: "700" },
  empty: { padding: 32, alignItems: "center", gap: 8, borderWidth: 1, borderStyle: "dashed" },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  fieldCard: { borderWidth: 1, overflow: "hidden" },
  fieldCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  fieldNum: { fontSize: 17, fontWeight: "900", letterSpacing: -0.3 },
  fieldIdMeta: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  fieldMeta: { fontSize: 12, fontWeight: "500" },
  fieldCreated: { fontSize: 11, fontWeight: "500", marginTop: 1 },
  fieldThumb: { width: 52, height: 52, borderRadius: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  stageRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12 },
  stageDot: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  stageLine: { flex: 1, height: 2, borderRadius: 1 },
  nextHint: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  nextText: { fontSize: 12, fontWeight: "800" },
});
