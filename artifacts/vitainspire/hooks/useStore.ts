import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export interface Farmer {
  id: string;
  name: string;
  photoUri: string | null;
  createdAt: string;
}

export type FieldStatus = "standing" | "cut" | "chopped" | "silage";

export interface FieldCapture {
  uri: string;
  capturedAt: string;
}

export interface SilageData {
  ready: boolean;
  photos: {
    storage: string | null;
    crossSection: string | null;
    sample: string | null;
    texture: string | null;
  };
  pH: string;
  smell: string;
  mold: string;
  grade: "A" | "B" | "C" | "";
  submittedAt: string;
}

export interface Field {
  id: string;
  numericId: number;
  state: string;
  district: string;
  cropType: string;
  area: string;
  createdAt: string;
  status: FieldStatus;
  standing: {
    plantUri: string | null;
    leafCobUri: string | null;
    capturedAt: string;
  };
  cut: FieldCapture | null;
  chopped: FieldCapture | null;
  silage: SilageData | null;
}

const KEYS = {
  FARMER: "@vitainspire/farmer_v2",
  FIELDS: "@vitainspire/fields_v2",
  ONBOARDED: "@vitainspire/onboarded_v2",
};

export function useStore() {
  const [farmer, setFarmerState] = useState<Farmer | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [onboarded, setOnboardedState] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [f, fl, ob] = await Promise.all([
        AsyncStorage.getItem(KEYS.FARMER),
        AsyncStorage.getItem(KEYS.FIELDS),
        AsyncStorage.getItem(KEYS.ONBOARDED),
      ]);
      setFarmerState(f ? JSON.parse(f) : null);
      setFields(fl ? JSON.parse(fl) : []);
      setOnboardedState(ob === "true");
    } catch (e) {
      console.error("Failed to load store data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setFarmer = async (f: Farmer) => {
    setFarmerState(f);
    await AsyncStorage.setItem(KEYS.FARMER, JSON.stringify(f));
    setOnboardedState(true);
    await AsyncStorage.setItem(KEYS.ONBOARDED, "true");
  };

  const addField = async (field: Field) => {
    const updated = [field, ...fields];
    setFields(updated);
    await AsyncStorage.setItem(KEYS.FIELDS, JSON.stringify(updated));
  };

  const updateField = async (id: string, patch: Partial<Field>) => {
    const updated = fields.map((f) => (f.id === id ? { ...f, ...patch } : f));
    setFields(updated);
    await AsyncStorage.setItem(KEYS.FIELDS, JSON.stringify(updated));
  };

  const getNextNumericId = () => {
    const max = fields.reduce((m, f) => (f.numericId > m ? f.numericId : m), 0);
    return max + 1;
  };

  const reset = async () => {
    await AsyncStorage.multiRemove([KEYS.FARMER, KEYS.FIELDS, KEYS.ONBOARDED]);
    setFarmerState(null);
    setFields([]);
    setOnboardedState(false);
  };

  return {
    farmer,
    fields,
    onboarded,
    loading,
    setFarmer,
    addField,
    updateField,
    getNextNumericId,
    reset,
    refresh: loadData,
  };
}
