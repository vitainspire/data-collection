import React, { createContext, useContext, useState } from "react";
import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export interface SilageState {
  fieldId: string;
  sampleId: string;
  gps: { latitude: number; longitude: number } | null;
  eligibilityConfirmed: boolean;
  sampleCollected: boolean;
  photos: [string | null, string | null, string | null, string | null];
  pH: "" | "<4.2" | "4.2-4.8" | ">4.8";
  sensory: {
    smell: string;
    moisture: string;
    mold: string;
    temperature: string;
  };
  context: {
    crop: string;
    storage: string;
    age: string;
    weather: string;
    feedingStatus: string;
  };
  grade: "" | "A" | "B" | "C";
  needsReview: boolean;
}

const defaultState: SilageState = {
  fieldId: "",
  sampleId: "",
  gps: null,
  eligibilityConfirmed: false,
  sampleCollected: false,
  photos: [null, null, null, null],
  pH: "",
  sensory: { smell: "Pleasant", moisture: "Optimal", mold: "None", temperature: "Cool" },
  context: { crop: "Maize", storage: "Pit", age: "45-60", weather: "Dry", feedingStatus: "Just Opened" },
  grade: "",
  needsReview: false,
};

interface SilageContextType {
  data: SilageState;
  updateData: (updates: Partial<SilageState>) => void;
  reset: () => void;
}

const SilageContext = createContext<SilageContextType | null>(null);

export function useSilageContext() {
  const ctx = useContext(SilageContext);
  if (!ctx) throw new Error("useSilageContext must be used within SilageProvider");
  return ctx;
}

export default function SilageLayout() {
  const colors = useColors();
  const [data, setData] = useState<SilageState>(defaultState);

  const updateData = (updates: Partial<SilageState>) => setData((prev) => ({ ...prev, ...updates }));
  const reset = () => setData(defaultState);

  return (
    <SilageContext.Provider value={{ data, updateData, reset }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </SilageContext.Provider>
  );
}
