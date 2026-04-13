from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import random
import asyncio
import logging
import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]
app = FastAPI(title="HealthSentinel - Clinical API")

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("HealthSentinel")

# 1. CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Global System State
patients_db = [
    {"id": "4002", "name": "John Doe", "status": "Critical", "heartRate": 115, "riskScore": 88, "ward": "ICU-01"},
    {"id": "3015", "name": "Jane Smith", "status": "Stable", "heartRate": 72, "riskScore": 12, "ward": "General-04"},
    {"id": "1092", "name": "Robert Brown", "status": "Warning", "heartRate": 95, "riskScore": 45, "ward": "ICU-03"},
    {"id": "2281", "name": "Alice Wilson", "status": "Stable", "heartRate": 68, "riskScore": 15, "ward": "General-02"}
]

# 3. WebSocket Real-Time Stream
@app.websocket("/ws/patients")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("✅ ClinOps WebSocket: Connection Established")

    tick = 0
    # Refined ECG Pattern
    ecg_template = [0, 2, 0, -5, 50, -10, 8, 0, 0, 0]

    try:
        while True:
            # 60s Total Cycle (20 ticks per phase * 0.8s = 16s each)
            # Total = 80 ticks for 4 phases
            cycle_tick = tick % 80

            if cycle_tick < 20:
                # Phase 1: Bradycardia (BPM < 60)
                patients_db[0]["status"] = "Critical"
                base_hr = 48
            elif cycle_tick < 40:
                # Phase 2: Normal Sinus Rhythm (BPM 60-85)
                patients_db[0]["status"] = "Stable"
                base_hr = 72
            elif cycle_tick < 60:
                # Phase 3: Elevated/Warning (BPM 85-110)
                patients_db[0]["status"] = "Warning"
                base_hr = 98
            else:
                # Phase 4: Tachycardia (BPM > 120)
                patients_db[0]["status"] = "Critical"
                base_hr = 128

            for patient in patients_db:
                # Only John Doe follows the cycle, others stay stable
                current_base = base_hr if patient["id"] == "4002" else 72
                
                # Sync Risk Score to Phase
                if patient["id"] == "4002":
                    if current_base < 60: patient["riskScore"] = random.randint(75, 85)
                    elif current_base > 120: patient["riskScore"] = random.randint(90, 98)
                    else: patient["riskScore"] = random.randint(10, 40)

                # ECG Rhythm + Noise
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

# 4. Standard REST Endpoints
@app.get("/")
def read_root():
    return {"status": "online", "system": "HealthSentinel", "version": "v2.3.0"}

@app.get("/api/patients")
def get_patients_http():
    return patients_db

if __name__ == "__main__":
    import uvicorn
    HOST = os.getenv("HOST", "0.0.0.0")  # nosec B104
    uvicorn.run(app, host=HOST, port=PORT)
