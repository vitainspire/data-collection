import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SplashScreen() {
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={ZoomIn.duration(800)} exiting={FadeOut} style={styles.logoContainer}>
        <MaterialCommunityIcons name="leaf" size={80} color={colors.primary} />
      </Animated.View>
      <Animated.View entering={FadeIn.delay(400).duration(800)} style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.foreground }]}>Vitainspire</Text>
        <Text style={[styles.tagline, { color: colors.accent }]}>Smart Farming. Better Yield.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 24,
  },
  textContainer: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "600",
  },
});
