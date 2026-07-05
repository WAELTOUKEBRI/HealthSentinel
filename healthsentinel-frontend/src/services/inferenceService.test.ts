import { expect, test, vi } from 'vitest'; // Change to 'jest' if you are using Jest
import { fetchInference } from './inferenceService'; // <-- Update function name if needed

// We mock the global fetch API so it doesn't try to make a real network request
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ prediction: "Low Risk", confidence: 0.95 }),
  })
) as any;

test('inferenceService handles API calls successfully', async () => {
  const dummyPayload = { vitals: "normal" };
  
  // Call the service
  const response = await fetchInference(dummyPayload as any);
  
  // Verify it works
  expect(response).toBeDefined();
  expect(global.fetch).toHaveBeenCalled();
});
