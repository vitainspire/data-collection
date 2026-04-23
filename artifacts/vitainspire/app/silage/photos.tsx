import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { PhotoSlot } from "@/components/PhotoSlot";
import { useColors } from "@/hooks/useColors";
import { useSilageContext } from "./_layout";

const SLOTS = [
  { label: "Storage Overview", hint: "Wide shot of pit/bag" },
  { label: "Cross-Section", hint: "Cut/exposed face" },
  { label: "Sample Bag", hint: "Sealed sample with label" },
  { label: "Color & Texture", hint: "Close-up of grain/fiber" },
];

export default function SilagePhotosScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, updateData } = useSilageContext();

  const setPhoto = (idx: number) => (uri: string) => {
    const next = [...data.photos] as SilagePhotos;
    next[idx] = uri;
    updateData({ photos: next });
  };

  const allDone = data.photos.every(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="4 Required Photos" subtitle="Steps 5-8 · Document the sample" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.banner, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Feather name="camera" size={18} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>
            Capture all 4 photos. Use natural light when possible.
          </Text>
        </View>

        {SLOTS.map((s, i) => (
          <PhotoSlot
            key={i}
            uri={data.photos[i]}
            onPhotoTaken={setPhoto(i)}
            label={`${i + 1}. ${s.label}`}
            hint={s.hint}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Continue to pH"
          disabled={!allDone}
          icon={<Feather name="arrow-right" size={20} color={colors.primaryForeground} />}
          onPress={() => router.push("/silage/ph")}
        />
      </View>
    </View>
  );
}

type SilagePhotos = [string | null, string | null, string | null, string | null];

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120 },
  banner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, marginBottom: 16,
  },
  bannerText: { flex: 1, fontWeight: "600", fontSize: 13 },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
