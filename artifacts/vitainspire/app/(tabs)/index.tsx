import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/hooks/useStore";
import { uniqueId } from "@/utils/idGenerator";

export default function HarvestHomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { farmers, fieldVisits, addFarmer, refresh } = useStore();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const captureFarmer = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let uri: string | null = null;
      if (Platform.OS === "web") {
        const r = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (!r.canceled) uri = r.assets[0].uri;
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") {
          Alert.alert("Camera permission", "Please allow camera access to capture farmer photos.");
          return;
        }
        const r = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!r.canceled) uri = r.assets[0].uri;
      }
      if (uri) {
        await addFarmer({
          id: uniqueId(),
          photoUri: uri,
          capturedAt: new Date().toISOString(),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.log("capture farmer error", e);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : 90;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
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
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Capture</Text>
      <TouchableOpacity
        onPress={captureFarmer}
        activeOpacity={0.85}
        style={[styles.captureCard, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
      >
        <View style={styles.captureIcon}>
          <Feather name="camera" size={28} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.captureTitle, { color: colors.primaryForeground }]}>
            Capture Farmer Photo
          </Text>
          <Text style={[styles.captureSub, { color: colors.primaryForeground, opacity: 0.85 }]}>
            Start a visit by photographing the farmer
          </Text>
        </View>
        <Feather name="chevron-right" size={22} color={colors.primaryForeground} />
      </TouchableOpacity>

      {farmers.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 12 }}
        >
          {farmers
            .slice(-10)
            .reverse()
            .map((f) => (
              <View
                key={f.id}
                style={[styles.farmerThumb, { borderColor: colors.border, borderRadius: colors.radius }]}
              >
                <Image source={{ uri: f.photoUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              </View>
            ))}
        </ScrollView>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Dashboard</Text>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/visit/field-acres");
        }}
        activeOpacity={0.85}
        style={[
          styles.actionCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.primary,
            borderRadius: colors.radius,
            borderWidth: 2,
          },
        ]}
      >
        <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="map-marker-plus" size={26} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, { color: colors.foreground }]}>
            Start a New Field Visit
          </Text>
          <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
            Walk the field, log observations, capture photos
          </Text>
        </View>
        <Feather name="chevron-right" size={22} color={colors.foreground} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/visit/list");
        }}
        activeOpacity={0.85}
        style={[
          styles.actionCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
            borderWidth: 1,
          },
        ]}
      >
        <View style={[styles.actionIcon, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={colors.accentForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, { color: colors.foreground }]}>
            Record Harvest Data
          </Text>
          <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
            {fieldVisits.length} saved {fieldVisits.length === 1 ? "field" : "fields"}
          </Text>
        </View>
        <Feather name="chevron-right" size={22} color={colors.foreground} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
        Recent Field Visits
      </Text>
      {fieldVisits.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="sprout-outline" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No field visits yet. Start one above.
          </Text>
        </View>
      ) : (
        fieldVisits.slice(0, 5).map((v) => (
          <View
            key={v.id}
            style={[styles.visitRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <View style={[styles.visitBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.visitBadgeText, { color: colors.primary }]}>{v.cropType.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.visitId, { color: colors.foreground }]}>{v.id}</Text>
              <Text style={[styles.visitMeta, { color: colors.mutedForeground }]}>
                {v.cropType} · {v.fieldArea} acres · {new Date(v.createdAt).toLocaleDateString()}
              </Text>
            </View>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
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
  farmerThumb: {
    width: 56,
    height: 56,
    overflow: "hidden",
    borderWidth: 1,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    marginBottom: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 16, fontWeight: "700" },
  actionSub: { fontSize: 13, marginTop: 2 },
  empty: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: { fontSize: 14, fontWeight: "500" },
  visitRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  visitBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  visitBadgeText: { fontSize: 16, fontWeight: "800" },
  visitId: { fontSize: 15, fontWeight: "700" },
  visitMeta: { fontSize: 12, marginTop: 2 },
});
