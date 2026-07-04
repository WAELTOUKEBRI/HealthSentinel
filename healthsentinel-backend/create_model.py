import joblib
from sklearn.ensemble import RandomForestClassifier
import numpy as np

# Create some dummy data (simulating patient vitals)
# Features: [heart_rate, blood_pressure, temperature]
X = np.array([[80, 120, 36.6], [120, 150, 38.5], [60, 110, 36.0], [100, 140, 37.5]])
y = np.array([0, 1, 0, 1])  # 0: Healthy, 1: Risk

# Train a simple model
model = RandomForestClassifier()
model.fit(X, y)

# Save the model
joblib.dump(model, 'model.pkl')
print("Model created successfully: model.pkl")
