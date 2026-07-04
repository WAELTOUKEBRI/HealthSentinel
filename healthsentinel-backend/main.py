from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import random
import asyncio
import logging
import os
import json
import requests  # Added for internal service communication
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
# Default to the internal Kubernetes/Docker service name
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://healthsentinel-ai-service:8000")
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]

app = FastAPI(title="HealthSentinel - Clinical API")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("HealthSentinel")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

patients_db = [
    {"id": "4002", "name": "John Doe", "status": "Critical", "heartRate": 115, "riskScore": 88, "ward": "ICU-01"},
    {"id": "3015", "name": "Jane Smith", "status": "Stable", "heartRate": 72, "riskScore": 12, "ward": "General-04"},
    {"id": "1092", "name": "Robert Brown", "status": "Warning", "heartRate": 95, "riskScore": 45, "ward": "ICU-03"},
    {"id": "2281", "name": "Alice Wilson", "status": "Stable", "heartRate": 68, "riskScore": 15, "ward": "General-02"}
]

@app.websocket("/ws/patients")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("✅ ClinOps WebSocket: Connection Established")
    tick = 0
    ecg_template = [0, 2, 0, -5, 50, -10, 8, 0, 0, 0]
    try:
        while True:
            cycle_tick = tick % 80
            if cycle_tick < 20:
                patients_db[0]["status"] = "Critical"
                base_hr = 48
            elif cycle_tick < 40:
                patients_db[0]["status"] = "Stable"
                base_hr = 72
            elif cycle_tick < 60:
                patients_db[0]["status"] = "Warning"
                base_hr = 98
            else:
                patients_db[0]["status"] = "Critical"
                base_hr = 128
            for patient in patients_db:
                current_base = base_hr if patient["id"] == "4002" else 72
                if patient["id"] == "4002":
                    if current_base < 60: patient["riskScore"] = random.randint(75, 85)
                    elif current_base > 120: patient["riskScore"] = random.randint(90, 98)
                    else: patient["riskScore"] = random.randint(10, 40)
                patient_offset = int(patient["id"]) % len(ecg_template)
                phase = (tick + patient_offset) % len(ecg_template)
                patient["heartRate"] = int(current_base + ecg_template[phase] + random.randint(-1, 1))
            await websocket.send_json(patients_db)
            tick += 1
            await asyncio.sleep(0.8)
    except WebSocketDisconnect:
        logger.info("❌ WebSocket Session: Terminated by Client")
    except Exception as e:
        logger.error(f"⚠️ Unexpected System Error: {e}")

class TrainingStart(BaseModel):
    action: str

@app.post("/api/training/start")
async def start_training(request: TrainingStart):
    logger.info(f"Training Triggered: {request.action}")
    return {"status": "success"}

class PatientVitalsPayload(BaseModel):
    respirationRate: float = Field(..., ge=0, le=60, example=0.25)
    oxygenSaturation: float = Field(..., ge=50, le=100, example=1.5)
    systolicBP: float = Field(..., ge=40, le=250, example=3.2)

def get_ai_prediction(heart_rate: int, blood_pressure: int, temperature: float):
    """Internal helper to communicate with the AI Microservice"""
    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/predict", 
            json={
                "heart_rate": heart_rate,
                "blood_pressure": blood_pressure,
                "temperature": temperature
            },
            timeout=5
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"AI Service communication failed: {e}")
        return None

@app.post("/api/v1/inference/predict")
async def predict_clinical_risk(payload: PatientVitalsPayload):
    # Mapping payload to AI service requirements
    # Note: Using systolicBP, oxygenSaturation, respirationRate as proxies for model inputs
    prediction_result = get_ai_prediction(
        heart_rate=int(payload.systolicBP), 
        blood_pressure=int(payload.oxygenSaturation), 
        temperature=float(payload.respirationRate)
    )

    if prediction_result:
        return {
            "status": "success",
            "score": prediction_result.get("risk_level"),
            "severity": "Critical" if prediction_result.get("risk_level") == 1 else "Stable",
            "reasoning": "Inference complete via internal AI Microservice"
        }
    else:
        # Fallback if the AI microservice is down
        return {
            "status": "simulated",
            "score": 0.82 if payload.respirationRate > 20 else 0.15,
            "severity": "Critical" if payload.respirationRate > 20 else "Stable",
            "reasoning": "AI Service Unreachable - Fallback mode"
        }

@app.get("/")
def read_root():
    return {"status": "online", "system": "HealthSentinel", "version": "v2.3.0"}

@app.get("/api/patients")
def get_patients_http():
    return patients_db

if __name__ == "__main__":
    import uvicorn
    HOST = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=HOST, port=PORT)
