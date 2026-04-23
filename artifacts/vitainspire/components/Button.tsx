import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "lg",
  loading = false,
  icon,
  fullWidth = true,
  style,
  onPress,
  disabled,
  ...props
}: ButtonProps) {
  const colors = useColors();

  const handlePress = (e: any) => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: colors.radius,
      gap: 8,
      opacity: disabled ? 0.5 : 1,
    };

    if (fullWidth) base.width = "100%";

    switch (size) {
      case "sm":
        base.paddingVertical = 8;
        base.paddingHorizontal = 16;
        break;
      case "md":
        base.paddingVertical = 12;
        base.paddingHorizontal = 24;
        break;
      case "lg":
      default:
        base.paddingVertical = 16;
        base.paddingHorizontal = 32;
        break;
    }

    switch (variant) {
      case "primary":
        base.backgroundColor = colors.primary;
        break;
      case "secondary":
        base.backgroundColor = colors.secondary;
        break;
      case "outline":
        base.backgroundColor = "transparent";
        base.borderWidth = 2;
        base.borderColor = colors.primary;
        break;
      case "ghost":
        base.backgroundColor = "transparent";
        break;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: "600",
      fontSize: size === "sm" ? 14 : size === "lg" ? 18 : 16,
    };

    switch (variant) {
      case "primary":
        base.color = colors.primaryForeground;
        break;
      case "secondary":
        base.color = colors.secondaryForeground;
        break;
      case "outline":
      case "ghost":
        base.color = colors.primary;
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextStyle().color} />
      ) : (
        <>
          {icon}
          {title && <Text style={getTextStyle()}>{title}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}
