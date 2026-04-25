import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export interface Farmer {
  id: string;
  name: string;
  photoUri: string | null;
  createdAt: string;
}

export type FieldStatus = "standing" | "cut" | "chopped" | "silage";

// Every capture records who did it and when
export interface FieldCapture {
  uri: string;
  capturedAt: string;
  capturedBy: string;
}

export interface ZoneData {
  plantUri: string | null;
  leafUri: string | null;
  cobUri: string | null;
  plantHeight: "Tall" | "Medium" | "Short" | "";
  plantColor: "Dark" | "Medium" | "Pale" | "";
  standDensity: "Dense" | "Medium" | "Sparse" | "";
}

export interface FieldVisit {
  visitId: string;
  createdAt: string;
  state: string;
  stateName: string;
  district: string;
  districtName: string;
  areaAcres: string;
  cropType: string;
  zones: { A: ZoneData; B: ZoneData; C: ZoneData };
  fieldHealth: {
    plantStand: "Good" | "Medium" | "Poor" | "";
    pestPressure: "None" | "Mild" | "Severe" | "";
    diseaseSeen: "Yes" | "No" | "";
    rainfallPattern: "Adequate" | "Low" | "Excess" | "";
  };
  fieldPhotos: {
    overview: string | null;
    leaf: string | null;
    cob: string | null;
  };
  savedAt: string;
}

export interface SilageData {
  sampleId: string;
  gps: { latitude: number; longitude: number } | null;
  eligibilityConfirmed: boolean;
  ready: boolean;
  photos: {
    storage: string | null;
    crossSection: string | null;
    sample: string | null;
    texture: string | null;
  };
  pH: "<4.2" | "4.2-4.8" | ">4.8" | "";
  smell: "Pleasant" | "Neutral" | "Foul" | "";
  moisture: "Dry" | "Optimal" | "Wet" | "";
  mold: "None" | "Surface" | "Deep" | "";
  temperature: "Cool" | "Warm" | "Hot" | "";
  cropType: string;
  storageType: "Pit" | "Bag" | "Bunker" | "";
  age: "30-45" | "45-60" | "60+" | "";
  recentWeather: "Dry" | "Mixed" | "Wet" | "";
  feedingStatus: "Just Opened" | "Mid-feed" | "Almost Done" | "";
  grade: "A" | "B" | "C" | "";
  needsReview: boolean;
  submittedAt: string;
}

export interface CutObservation {
  harvestMethod: "Manual" | "Machine" | "";
  cropCondition: "Green" | "Dry" | "Mixed" | "";
  cuttingHeight: "Low" | "Medium" | "High" | "";
  lodging: "None" | "Some" | "Heavy" | "";
  capturedBy: string;
  savedAt: string;
}

export interface ChoppedObservation {
  chopLength: "Fine" | "Medium" | "Coarse" | "";
  uniformity: "Uniform" | "Mixed" | "Uneven" | "";
  materialQuality: "Good" | "Fair" | "Poor" | "";
  capturedBy: string;
  savedAt: string;
}

export type Irrigation = "Rainfed" | "Irrigated" | "Mixed" | "";

export interface CropDetails {
  variety: string;
  sowingDate: string;
  expectedHarvestDate: string;
  irrigation: Irrigation;
  plantHeightCm: string;
  rowSpacingCm: string;
  plantSpacingCm: string;
  notes: string;
}

export interface FieldGPS {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  capturedAt: string;
}

export interface StandingCapture {
  plantUri: string | null;
  leafCobUri: string | null;
  capturedAt: string;
  capturedBy: string;
}

export interface ZonesCapture {
  A: ZoneData;
  B: ZoneData;
  C: ZoneData;
  capturedBy: string;
  capturedAt: string;
}

export interface Field {
  id: string;
  numericId: number;
  state: string;
  stateName: string;
  district: string;
  districtName: string;
  cropType: string;
  cropDetails: CropDetails;
  area: string;
  gps: FieldGPS | null;
  createdAt: string;
  createdBy: string;
  status: FieldStatus;
  standing: StandingCapture;
  zones?: ZonesCapture;
  cut: FieldCapture | null;
  cutData: CutObservation | null;
  chopped: FieldCapture | null;
  choppedData: ChoppedObservation | null;
  fieldVisit: FieldVisit | null;
  silage: SilageData | null;
}

const KEYS = {
  FARMER: "@vitainspire/farmer_v2",
  FIELDS: "@vitainspire/fields_v5",
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
