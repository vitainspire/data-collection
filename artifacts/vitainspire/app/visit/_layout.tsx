import React, { createContext, useContext, useState } from "react";
import { Stack } from "expo-router";
import { ZoneData } from "@/hooks/useStore";
import { useColors } from "@/hooks/useColors";

export interface VisitState {
  state: string;
  district: string;
  fieldArea: string;
  cropType: string;
  zones: {
    A: ZoneData;
    B: ZoneData;
    C: ZoneData;
  };
  overallHealth: {
    plantStand: string;
    pestPressure: string;
    diseaseSeen: string;
    rainfallPattern: string;
  };
  photos: {
    overview: string | null;
    leaf: string | null;
    cob: string | null;
  };
}

const defaultZone: ZoneData = {
  plantPhoto: null,
  cobPhoto: null,
  plantHeight: "Medium",
  plantColor: "Medium",
  standDensity: "Medium",
};

const defaultState: VisitState = {
  state: "AP",
  district: "KNL",
  fieldArea: "",
  cropType: "Maize",
  zones: {
    A: { ...defaultZone },
    B: { ...defaultZone },
    C: { ...defaultZone },
  },
  overallHealth: {
    plantStand: "Good",
    pestPressure: "None",
    diseaseSeen: "No",
    rainfallPattern: "Adequate",
  },
  photos: { overview: null, leaf: null, cob: null },
};

interface VisitContextType {
  data: VisitState;
  updateData: (updates: Partial<VisitState>) => void;
  updateZone: (zone: "A" | "B" | "C", updates: Partial<ZoneData>) => void;
  reset: () => void;
}

const VisitContext = createContext<VisitContextType | null>(null);

export function useVisitContext() {
  const ctx = useContext(VisitContext);
  if (!ctx) throw new Error("useVisitContext must be used within VisitProvider");
  return ctx;
}

export default function VisitLayout() {
  const colors = useColors();
  const [data, setData] = useState<VisitState>(defaultState);

  const updateData = (updates: Partial<VisitState>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const updateZone = (zone: "A" | "B" | "C", updates: Partial<ZoneData>) => {
    setData((prev) => ({
      ...prev,
      zones: { ...prev.zones, [zone]: { ...prev.zones[zone], ...updates } },
    }));
  };

  const reset = () => setData(defaultState);

  return (
    <VisitContext.Provider value={{ data, updateData, updateZone, reset }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </VisitContext.Provider>
  );
}
