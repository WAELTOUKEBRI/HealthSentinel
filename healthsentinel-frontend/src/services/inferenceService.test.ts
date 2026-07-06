import { expect, test, vi, beforeEach } from 'vitest';
import { fetchClinicalRiskScore } from './inferenceService';

describe('fetchClinicalRiskScore Coverage Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Hits the successful execution lines
  test('handles successful API responses', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: "healthy", score: 0.05, severity: "Stable", reasoning: "Normal parameters" }),
      })
    ));

    const result = await fetchClinicalRiskScore({
      respirationRate: 14,
      oxygenSaturation: 99,
      systolicBP: 118
    });

    expect(result.status).toBe("healthy");
    expect(result.score).toBe(0.05);
  });

  // 2. Hits the (!response.ok) error handling branch
  test('handles backend server errors response gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      })
    ));

    const result = await fetchClinicalRiskScore({
      respirationRate: 16,
      oxygenSaturation: 98,
      systolicBP: 120
    });

    // The function catches the error internally and returns the fallback object
    expect(result.status).toBe("simulated");
    expect(result.severity).toBe("Stable");
  });

  // 3. Hits the catch(error) network failure block
  test('handles complete network or engine failure gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error("Network Down"))));

    const result = await fetchClinicalRiskScore({
      respirationRate: 22,
      oxygenSaturation: 90,
      systolicBP: 140
    });

    expect(result.status).toBe("simulated");
    expect(result.reasoning).toContain("Heuristic fallback");
  });
});
