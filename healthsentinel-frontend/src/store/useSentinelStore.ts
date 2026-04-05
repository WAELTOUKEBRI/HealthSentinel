import { create } from 'zustand';

interface Patient {
  id: string;
  name: string;
  status: "Critical" | "Warning" | "Stable";
  heartRate: number;
  history?: number[];
  ward: string;
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
  setPatients: (patients) => set({
    patients,
    criticalCount: patients.filter(p => p.status === 'Critical').length
  }),
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
}));
