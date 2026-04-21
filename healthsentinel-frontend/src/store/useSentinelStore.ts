import { create } from 'zustand';

export interface Patient {
  id: string;
  name: string;
  status: "Critical" | "Warning" | "Stable";
  heartRate: number;
  history?: number[];
  // NEW: NEWS2 parameters matching Prisma
  respirationRate?: number;
  oxygenSaturation?: number;
  systolicBP?: number;
  temperature?: number;
  consciousness?: "Alert" | "Voice" | "Pain" | "Unresponsive"; // AVPU Scale
  ward: string;
  riskScore: number;
}

interface SentinelStore {
  patients: Patient[];
  criticalCount: number;
  selectedPatientId: string | null; // Track who we are looking at
  setPatients: (patients: Patient[]) => void;
  setSelectedPatientId: (id: string | null) => void;
}

export const useSentinelStore = create<SentinelStore>((set) => ({
  patients: [],
  criticalCount: 0,
  selectedPatientId: null,
  setPatients: (patients) => {

    const criticalCount = patients.filter(p => p.status === 'Critical').length;
    set({ patients, criticalCount });
  },
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
}));

