from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
import random
import asyncio
import logging

app = FastAPI(title="HealthSentinel - Clinical API")

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("HealthSentinel")

# 1. CORS Setup (Essential for Localhost:3000 to talk to Localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Global System State (Initial Database)
patients_db = [
    {"id": "#4002", "name": "John Doe", "status": "Critical", "heartRate": 135, "riskScore": 88, "ward": "ICU-01"},
    {"id": "#3015", "name": "Jane Smith", "status": "Stable", "heartRate": 72, "riskScore": 12, "ward": "General-04"},
    {"id": "#1092", "name": "Robert Brown", "status": "Warning", "heartRate": 95, "riskScore": 45, "ward": "ICU-03"},
    {"id": "#2281", "name": "Alice Wilson", "status": "Stable", "heartRate": 68, "riskScore": 15, "ward": "General-02"}
]

# 3. WebSocket Real-Time Stream
@app.websocket("/ws/patients")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("✅ ClinOps WebSocket: Connection Established")
    try:
        while True:
            # 🔹 Physiological Simulation Logic
            for patient in patients_db:
                # Add small "jitter" to heart rate
                jitter = random.randint(-8, 8)
                patient["heartRate"] = max(45, min(175, patient["heartRate"] + jitter))

                # Update Status based on clinical thresholds
                if patient["heartRate"] >= 130 or patient["heartRate"] <= 50:
                    patient["status"] = "Critical"
                elif 100 <= patient["heartRate"] < 130 or 50 < patient["heartRate"] <= 60:
                    patient["status"] = "Warning"
                else:
                    patient["status"] = "Stable"

                # Calculate Risk Score (Simulated ML Output)
                patient["riskScore"] = min(100, max(0, int((patient["heartRate"] - 60) * 0.8 + random.randint(0,5))))

            # 🔹 Push to Frontend
            await websocket.send_json(patients_db)
            
            # 🔹 Stream Rate: 3 seconds
            await asyncio.sleep(3)

    except WebSocketDisconnect:
        logger.info("❌ WebSocket Session: Terminated by Client")
    except Exception as e:
        logger.error(f"⚠️ Unexpected System Error: {e}")

# 4. Standard REST Endpoints (For Initial Load or Debugging)
@app.get("/")
def read_root():
    return {
        "status": "online", 
        "system": "HealthSentinel", 
        "version": "v2.1.0",
        "mode": "WebSocket Enabled"
    }

@app.get("/api/patients", summary="Get all patients", description="Returns the current list of patients, their vitals, and their risk scores.")
def get_patients_http():
    """Fallback endpoint for standard HTTP requests."""
    return patients_db

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Prevents 404 errors in browser logs."""
    return Response(content="", media_type="image/x-icon")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
