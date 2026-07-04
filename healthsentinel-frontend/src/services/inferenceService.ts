// src/services/inferenceService.ts

// 1. DEFINE THE CONSTANT HERE: This pulls the variable from your .env file
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface VitalsPayload {
  respirationRate: number;
  oxygenSaturation: number;
  systolicBP: number;
}

export async function fetchClinicalRiskScore(vitals: VitalsPayload) {
  // Defensive: Ensure we never send null to the backend
  const cleanPayload = {
    respirationRate: Number(vitals.respirationRate) || 16,
    oxygenSaturation: Number(vitals.oxygenSaturation) || 98,
    systolicBP: Number(vitals.systolicBP) || 120,
  };

  try {
    // 2. USE THE CONSTANT: Now it is defined and accessible here
    const response = await fetch(`${API_URL}/v1/inference/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend Error: ${errorText}`);
      throw new Error(`Server returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Inference Engine Unavailable:", error);
    return {
      status: "simulated",
      score: 0.15,
      severity: "Stable",
      reasoning: "Heuristic fallback: Engine unresponsive.",
    };
  }
}
