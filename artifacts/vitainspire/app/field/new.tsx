import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import { Button } from "@/components/Button";
import { CapturePhotoCard } from "@/components/CapturePhotoCard";
import { LocationPicker } from "@/components/LocationPicker";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";
import { usePreciseLocation, formatLatLon } from "@/hooks/usePreciseLocation";
import { makeFieldId } from "@/utils/idGenerator";
import { INDIA_STATES, findState, findDistrict } from "@/data/indiaLocations";

const CROPS = ["Maize", "Sorghum", "Bajra", "Wheat", "Rice", "Other"];

export default function NewFieldScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addField, getNextNumericId, refresh } = useStore();
  const { gps, status: gpsStatus, error: gpsError, start: startGps } = usePreciseLocation();

  // Default to Andhra Pradesh / Kurnool (which exists in the new dataset)
  const [stateCode, setStateCode] = useState("AP");
  const [districtCode, setDistrictCode] = useState(() => {
    const ap = findState("AP");
    const knl = ap?.districts.find((d) => d.name === "Kurnool");
    return knl?.code ?? ap?.districts[0]?.code ?? "ATP";
  });
  const [crop, setCrop] = useState("Maize");
  const [area, setArea] = useState("");
  const [plantUri, setPlantUri] = useState<string | null>(null);
  const [leafCobUri, setLeafCobUri] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savedField, setSavedField] = useState<{ id: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Refresh from storage when this screen mounts (for area returned from walker)
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Kick off GPS on mount
  useEffect(() => {
    startGps();
  }, [startGps]);

  const stateObj = findState(stateCode) ?? INDIA_STATES[0];
  const districtObj =
    findDistrict(stateCode, districtCode) ?? stateObj.districts[0];

  const canSave = !!plantUri && !!crop;

  const save = async () => {
    if (!plantUri) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const numericId = getNextNumericId();
    const id = makeFieldId(stateCode, districtObj.code, numericId);
    await addField({
      id,
      numericId,
      state: stateCode,
      stateName: stateObj.name,
      district: districtObj.code,
      districtName: districtObj.name,
      cropType: crop,
      area,
      gps: gps
        ? {
            latitude: gps.latitude,
            longitude: gps.longitude,
            accuracy: gps.accuracy,
            altitude: gps.altitude,
            capturedAt: gps.capturedAt,
          }
        : null,
      createdAt: new Date().toISOString(),
      status: "standing",
      standing: {
        plantUri,
        leafCobUri,
        capturedAt: new Date().toISOString(),
      },
      cut: null,
      chopped: null,
      silage: null,
    });
    setSavedField({ id });
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 12) : insets.top;
  const bottomPad = Platform.OS === "web" ? 30 : insets.bottom + 16;

  // Result screen
  if (savedField) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <View style={[styles.iconBtn, { opacity: 0 }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground, textAlign: "center" }]}>
              Field Created
            </Text>
          </View>
          <View style={[styles.iconBtn, { opacity: 0 }]} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 20 }}>
          <Animated.View
            entering={FadeIn.duration(400)}
            style={[
              styles.successCard,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.successIcon}>
              <Feather name="check" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.successLabel, { color: colors.primaryForeground, opacity: 0.85 }]}>
              FIELD ID
            </Text>
            <Text style={[styles.successId, { color: colors.primaryForeground }]}>
              {savedField.id}
            </Text>
            <Text style={[styles.successSub, { color: colors.primaryForeground, opacity: 0.85 }]}>
              {crop} · {area || "—"} acres
            </Text>
            <Text style={[styles.successSub, { color: colors.primaryForeground, opacity: 0.75, marginTop: 2 }]}>
              {stateObj.name} · {districtObj.name}
            </Text>
            {gps && (
              <Text style={[styles.successSub, { color: colors.primaryForeground, opacity: 0.75, marginTop: 2 }]}>
                {formatLatLon(gps)}
              </Text>
            )}
          </Animated.View>

          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}>
            Status
          </Text>
          <View style={{ gap: 8 }}>
            <StatusRow label="Standing" done colors={colors} />
            <StatusRow label="Cut" colors={colors} />
            <StatusRow label="Chopped" colors={colors} />
            <StatusRow label="Silage" colors={colors} />
          </View>

          <Button
            title="Back to Field Capture"
            onPress={() => router.replace("/(tabs)")}
            style={{ marginTop: 32 }}
            icon={<Feather name="arrow-left" size={18} color={colors.primaryForeground} />}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
          activeOpacity={0.7}
        >
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Field</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Step 1 · Standing crop
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: colors.foreground }]}>Location</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerOpen(true);
          }}
          activeOpacity={0.85}
          style={[
            styles.locationBtn,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locName, { color: colors.foreground }]} numberOfLines={1}>
              {stateObj.name} · {districtObj.name}
            </Text>
            <Text style={[styles.locId, { color: colors.mutedForeground }]}>
              ID prefix: {stateCode}-{districtObj.code}
            </Text>
          </View>
          <Feather name="chevron-down" size={18} color={colors.foreground} />
        </TouchableOpacity>

        {/* Precise GPS card */}
        <View
          style={[
            styles.gpsCard,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            {gps ? (
              <>
                <Text style={[styles.locName, { color: colors.foreground }]} numberOfLines={1}>
                  {formatLatLon(gps)}
                </Text>
                <Text style={[styles.locId, { color: colors.mutedForeground }]}>
                  Accuracy ±{gps.accuracy != null ? Math.round(gps.accuracy) : "?"} m
                  {gps.altitude != null ? ` · alt ${Math.round(gps.altitude)} m` : ""}
                </Text>
              </>
            ) : gpsStatus === "requesting" ? (
              <>
                <Text style={[styles.locName, { color: colors.foreground }]}>Locating…</Text>
                <Text style={[styles.locId, { color: colors.mutedForeground }]}>
                  Waiting for GPS fix
                </Text>
              </>
            ) : gpsStatus === "denied" ? (
              <>
                <Text style={[styles.locName, { color: colors.foreground }]}>
                  Permission needed
                </Text>
                <Text style={[styles.locId, { color: colors.mutedForeground }]}>
                  Tap retry and allow access
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.locName, { color: colors.foreground }]}>
                  GPS not available
                </Text>
                <Text style={[styles.locId, { color: colors.mutedForeground }]}>
                  {gpsError ?? "Tap retry to try again"}
                </Text>
              </>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              startGps();
            }}
            style={[styles.refreshBtn, { backgroundColor: colors.secondary }]}
            activeOpacity={0.7}
          >
            <Feather
              name="refresh-cw"
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.foreground, marginTop: 22 }]}>Crop</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CROPS.map((c) => {
            const sel = c === crop;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCrop(c);
                }}
                activeOpacity={0.85}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: sel ? colors.primary : colors.border,
                  backgroundColor: sel ? colors.primary : colors.card,
                }}
              >
                <Text
                  style={{
                    color: sel ? colors.primaryForeground : colors.foreground,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.foreground, marginTop: 22 }]}>
          Field area (acres) — optional
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={area}
            onChangeText={setArea}
            placeholder="e.g. 2.5"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                flex: 1,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() => router.push("/field/walker")}
            activeOpacity={0.85}
            style={[
              styles.walkBtn,
              { backgroundColor: colors.secondary, borderColor: colors.primary, borderRadius: colors.radius },
            ]}
          >
            <MaterialCommunityIcons name="walk" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Walk</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 24 }}>
          <CapturePhotoCard
            label="Standing Plant"
            hint="Wide shot of the standing crop"
            uri={plantUri}
            onChange={setPlantUri}
            height={200}
          />
          <CapturePhotoCard
            label="Leaf / Cob"
            hint="Close-up to assess crop quality"
            uri={leafCobUri}
            onChange={setLeafCobUri}
            optional
            height={170}
          />
        </View>

        <Button
          title="Save Field"
          onPress={save}
          disabled={!canSave || saving}
          loading={saving}
          icon={<Feather name="save" size={20} color={colors.primaryForeground} />}
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      <LocationPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedState={stateCode}
        selectedDistrict={districtCode}
        onSelect={(s, d) => {
          setStateCode(s.code);
          setDistrictCode(d.code);
        }}
      />
    </View>
  );
}

function StatusRow({
  label,
  done,
  colors,
}: {
  label: string;
  done?: boolean;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.statusRow,
        {
          backgroundColor: done ? colors.primary + "15" : colors.secondary,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: done ? colors.primary : "transparent",
            borderColor: done ? colors.primary : colors.border,
          },
        ]}
      >
        {done ? (
          <Feather name="check" size={13} color={colors.primaryForeground} />
        ) : (
          <Feather name="clock" size={13} color={colors.mutedForeground} />
        )}
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: done ? colors.foreground : colors.mutedForeground,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  label: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  gpsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  locName: { fontSize: 15, fontWeight: "700" },
  locId: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: "700",
  },
  walkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
  },
  successCard: { padding: 30, alignItems: "center", gap: 4 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  successId: { fontSize: 32, fontWeight: "900", letterSpacing: 1, marginVertical: 6 },
  successSub: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  statusDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
