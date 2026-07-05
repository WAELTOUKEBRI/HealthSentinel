// 1. Correct the import to match the exported function name
import { fetchClinicalRiskScore } from './inferenceService';

// Mock the global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      status: "success", 
      score: 0.9, 
      severity: "Healthy", 
      reasoning: "Test passed" 
    }),
  })
) as jest.Mock;

describe('inferenceService', () => {
  it('should call the API and return a prediction', async () => {
    // 2. Use the correct function name here
    const data = await fetchClinicalRiskScore({
      respirationRate: 16,
      oxygenSaturation: 98,
      systolicBP: 120
    });
    
    expect(data.severity).toBe('Healthy');
    expect(global.fetch).toHaveBeenCalled();
  });
});
