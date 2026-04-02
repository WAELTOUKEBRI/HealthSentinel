from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict 

app = FastAPI(title="HealthSentinel - Clinical API")

# CORS setup: This is the "Passport Control" for your API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Specifically allow our UI
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# A simple health check
@app.get("/")
def read_root():
    return {"status": "online", "system": "HealthSentinel", "version": "v2.0.0"}

# Our Mock Data Endpoint
@app.get("/api/patients")
@app.get("/api/patients")
def get_patients():
    """
    Returns live patient telemetry.
    In Phase 3, this will come from a PostgreSQL Database.
    In Phase 4, 'riskScore' will be calculated by AWS SageMaker.
    """
    return [
        {
            "id": "#4002",
            "name": "John Doe",
            "status": "Critical",
            "heartRate": 142,
            "riskScore": 88,
            "ward": "ICU-01"
        },
        {
            "id": "#3015",
            "name": "Jane Smith",
            "status": "Stable",
            "heartRate": 72,
            "riskScore": 12,
            "ward": "General-04"
        },
        {
            "id": "#1092",
            "name": "Robert Brown",
            "status": "Warning",
            "heartRate": 105,
            "riskScore": 45,
            "ward": "ICU-03"
        },
        {
            "id": "#2281",
            "name": "Alice Wilson",
            "status": "Stable",
            "heartRate": 68,
            "riskScore": 15,
            "ward": "General-02"
        }
    ]


