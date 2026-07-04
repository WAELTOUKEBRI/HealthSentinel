from fastapi import FastAPI
import joblib
import numpy as np
from pydantic import BaseModel

app = FastAPI()

# Load the model once when the service starts
model = joblib.load('model.pkl')

class PatientData(BaseModel):
    heart_rate: int
    blood_pressure: int
    temperature: float

@app.post("/predict")
async def predict(data: PatientData):
    # Prepare features
    features = np.array([[data.heart_rate, data.blood_pressure, data.temperature]])
    prediction = model.predict(features)
    return {"risk_level": int(prediction[0])}
