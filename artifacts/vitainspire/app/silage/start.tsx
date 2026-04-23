import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";
import { useSilageContext } from "./_layout";

export default function SilageStartScreen() {
  const colors = useColors();
  const router = useRouter();
  const { fieldVisits } = useStore();
  const { data, updateData } = useSilageContext();
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const grab = async () => {
      try {
        setGpsLoading(true);
        if (Platform.OS === "web") {
          if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (!cancelled) updateData({ gps: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } });
              },
              () => {},
              { timeout: 5000 }
            );
          }
        } else {
          const perm = await Location.requestForegroundPermissionsAsync();
          if (perm.status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            if (!cancelled) updateData({ gps: { latitude: loc.coords.latitude, longitude: loc.coords.longitude } });
          }
        }
      } catch {}
      finally { if (!cancelled) setGpsLoading(false); }
    };
    if (!data.gps) grab();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Start Silage Sample" subtitle="Step 1 · Pick a field" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.metaCard, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.foreground }]}>
              {new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.foreground }]}>
              {gpsLoading
                ? "Locating..."
                : data.gps
                ? `${data.gps.latitude.toFixed(4)}, ${data.gps.longitude.toFixed(4)}`
                : "GPS not available"}
            </Text>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.foreground, marginTop: 20 }]}>Select a field</Text>
        {fieldVisits.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No fields recorded yet. Add one from Harvest first, or continue without a field.
            </Text>
          </View>
        ) : (
          fieldVisits.map((f) => {
            const sel = data.fieldId === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => updateData({ fieldId: f.id })}
                activeOpacity={0.85}
                style={[
                  styles.fieldRow,
                  {
                    backgroundColor: sel ? colors.primary : colors.card,
                    borderColor: sel ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={sel ? "check-circle" : "circle-outline"}
                  size={22}
                  color={sel ? colors.primaryForeground : colors.mutedForeground}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: sel ? colors.primaryForeground : colors.foreground, fontWeight: "700" }}>
                    {f.id}
                  </Text>
                  <Text style={{ fontSize: 12, color: sel ? colors.primaryForeground : colors.mutedForeground, opacity: 0.85 }}>
                    {f.cropType} · {f.fieldArea} acres
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Continue"
          icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          onPress={() => router.push("/silage/eligibility")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 8 },
  metaCard: { padding: 14, gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaText: { fontWeight: "600", fontSize: 14 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  empty: { alignItems: "center", padding: 24, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center" },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 2,
    marginBottom: 8,
  },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
