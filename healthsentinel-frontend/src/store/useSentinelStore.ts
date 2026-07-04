// src/store/useSentinelStore.ts
import { create } from 'zustand';
import { fetchClinicalRiskScore, VitalsPayload } from "@/services/inferenceService";

export interface Patient {
  id: string;
  name: string;
  status: "Critical" | "Warning" | "Stable";
  heartRate: number;
  history?: number[];
  respirationRate?: number;
  oxygenSaturation?: number;
  systolicBP?: number;
  temperature?: number;
  consciousness?: "Alert" | "Voice" | "Pain" | "Unresponsive";
  ward: string;
  riskScore: number;
  aiReasoning?: string;
}

interface SentinelStore {
  patients: Patient[];
  criticalCount: number;
  selectedPatientId: string | null;
  setPatients: (patients: Patient[]) => void;
  setSelectedPatientId: (id: string | null) => void;
  analyzePatientRisk: (patientId: string) => Promise<void>;
}

export const useSentinelStore = create<SentinelStore>((set, get) => ({
  patients: [],
  criticalCount: 0,
  selectedPatientId: null,

  setPatients: (patients) => set({
    patients,
    criticalCount: patients.filter(p => p.status === "Critical").length
  }),

  setSelectedPatientId: (id) => set({ selectedPatientId: id }),

  analyzePatientRisk: async (patientId: string) => {
    const targetPatient = get().patients.find(p => p.id === patientId);
    if (!targetPatient) return;

    // Payload strictly matches the VitalsPayload interface from inferenceService.ts
    const payload: VitalsPayload = {
      respirationRate: targetPatient.respirationRate || 16,
      oxygenSaturation: targetPatient.oxygenSaturation || 98,
      systolicBP: targetPatient.systolicBP || 120,
    };

    try {
      const result = await fetchClinicalRiskScore(payload);

      const updatedPatients = get().patients.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            riskScore: Math.round(result.score * 100),
            status: result.severity as "Critical" | "Warning" | "Stable",
            aiReasoning: result.reasoning 
          };
        }
        return p;
      });

      set({
        patients: updatedPatients,
        criticalCount: updatedPatients.filter(p => p.status === "Critical").length
      });

    } catch (error) {
      console.error("AI Auto-Inference failed inside store:", error);
    }
  }
}));
