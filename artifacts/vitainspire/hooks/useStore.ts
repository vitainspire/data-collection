import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export interface Farmer {
  id: string;
  photoUri: string;
  capturedAt: string;
}

export interface FieldVisit {
  id: string;
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
  createdAt: string;
}

export interface ZoneData {
  plantPhoto: string | null;
  cobPhoto: string | null;
  plantHeight: string;
  plantColor: string;
  standDensity: string;
}

export interface SilageSample {
  sampleId: string;
  fieldId: string;
  photos: [string | null, string | null, string | null, string | null];
  pH: string;
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
  grade: string;
  needsReview: boolean;
  gps: {
    latitude: number;
    longitude: number;
  } | null;
  createdAt: string;
}

const KEYS = {
  FARMERS: "@vitainspire/farmers",
  FIELD_VISITS: "@vitainspire/field_visits",
  SILAGE_SAMPLES: "@vitainspire/silage_samples",
};

export function useStore() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [fieldVisits, setFieldVisits] = useState<FieldVisit[]>([]);
  const [silageSamples, setSilageSamples] = useState<SilageSample[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [f, fv, ss] = await Promise.all([
        AsyncStorage.getItem(KEYS.FARMERS),
        AsyncStorage.getItem(KEYS.FIELD_VISITS),
        AsyncStorage.getItem(KEYS.SILAGE_SAMPLES),
      ]);
      if (f) setFarmers(JSON.parse(f));
      if (fv) setFieldVisits(JSON.parse(fv));
      if (ss) setSilageSamples(JSON.parse(ss));
    } catch (e) {
      console.error("Failed to load store data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addFarmer = async (farmer: Farmer) => {
    const updated = [...farmers, farmer];
    setFarmers(updated);
    await AsyncStorage.setItem(KEYS.FARMERS, JSON.stringify(updated));
  };

  const addFieldVisit = async (visit: FieldVisit) => {
    const updated = [visit, ...fieldVisits];
    setFieldVisits(updated);
    await AsyncStorage.setItem(KEYS.FIELD_VISITS, JSON.stringify(updated));
  };

  const addSilageSample = async (sample: SilageSample) => {
    const updated = [sample, ...silageSamples];
    setSilageSamples(updated);
    await AsyncStorage.setItem(KEYS.SILAGE_SAMPLES, JSON.stringify(updated));
  };

  return {
    farmers,
    fieldVisits,
    silageSamples,
    loading,
    addFarmer,
    addFieldVisit,
    addSilageSample,
    refresh: loadData,
  };
}
