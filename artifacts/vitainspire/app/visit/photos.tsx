import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { PhotoSlot } from "@/components/PhotoSlot";
import { useColors } from "@/hooks/useColors";
import { useVisitContext } from "./_layout";
import { useStore } from "@/hooks/useStore";
import { generateFieldId } from "@/utils/idGenerator";

export default function PhotosScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, reset } = useVisitContext();
  const { fieldVisits, addFieldVisit } = useStore();
  const [submitting, setSubmitting] = useState(false);

  const set = (k: "overview" | "leaf" | "cob") => (uri: string) => {
    data.photos[k] = uri;
  };

  const allPhotos = data.photos.overview && data.photos.leaf && data.photos.cob;

  const submit = async () => {
    setSubmitting(true);
    try {
      const id = generateFieldId(
        data.state,
        data.district,
        fieldVisits.map((v) => v.id)
      );
      await addFieldVisit({
        id,
        state: data.state,
        district: data.district,
        fieldArea: data.fieldArea,
        cropType: data.cropType,
        zones: data.zones,
        overallHealth: data.overallHealth,
        photos: data.photos,
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      router.replace({ pathname: "/visit/success", params: { id } });
    } catch (e) {
      console.log("submit error", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Smart Photo Checklist" subtitle="Step 4 of 4 · Final photos" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Feather name="info" size={18} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>
            Capture all 3 photos before submitting the visit.
          </Text>
        </View>

        <PhotoSlot
          uri={data.photos.overview}
          onPhotoTaken={set("overview")}
          label="Field Overview"
          hint="Wide shot showing the whole field"
        />
        <PhotoSlot
          uri={data.photos.leaf}
          onPhotoTaken={set("leaf")}
          label="Leaf Close-up"
          hint="Single leaf, fill the frame"
        />
        <PhotoSlot
          uri={data.photos.cob}
          onPhotoTaken={set("cob")}
          label="Cob with Scale"
          hint="Include a coin or ruler for size reference"
        />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title={submitting ? "Saving..." : "Submit Field Visit"}
          loading={submitting}
          disabled={!allPhotos}
          icon={<Feather name="check" size={20} color={colors.primaryForeground} />}
          onPress={submit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: { flex: 1, fontWeight: "600", fontSize: 13 },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    borderTopWidth: 1,
  },
});
