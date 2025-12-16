# backend/main.py
import os
import sqlite3
import json
import shutil
from datetime import datetime
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rf_predictor import rf_sales_prediction   # ✅ Random Forest ML model

# ---------------- Paths ----------------
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "app_data.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------- App ----------------
app = FastAPI(title="Sales Forecasting API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DB Helpers ----------------
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productName TEXT,
            category TEXT,
            unitPrice REAL,
            discount REAL,
            region TEXT,
            season TEXT,
            predictedSales REAL,
            confidenceLevel TEXT,
            growthTrend REAL,
            insights TEXT,
            recommendation TEXT,
            created_at TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            payload TEXT,
            updated_at TEXT
        )
    """)

    cur.execute("SELECT COUNT(1) as c FROM settings")
    if cur.fetchone()["c"] == 0:
        default_payload = {
            "profile": {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john.doe@example.com",
                "company": "Example Co"
            },
            "model": {
                "predictionModel": "Random Forest",
                "defaultPeriod": 30,
                "confidenceThreshold": 85
            }
        }
        cur.execute(
            "INSERT INTO settings (id, payload, updated_at) VALUES (1, ?, ?)",
            (json.dumps(default_payload), datetime.utcnow().isoformat())
        )

    conn.commit()
    conn.close()


init_db()

# ---------------- Pydantic Models ----------------
class PredictionRequest(BaseModel):
    productName: str
    category: str
    unitPrice: float
    discount: float
    region: str
    season: str


class PredictionResponse(BaseModel):
    predictedSales: float
    confidenceLevel: str
    growthTrend: float
    insights: List[str]
    recommendation: str

# ---------------- Routes ----------------
@app.get("/")
def root():
    return {"status": "ok", "message": "Sales Forecasting API (Random Forest) is running"}

# ✅ ML prediction (NO DB SAVE)
@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    return rf_sales_prediction(request)

# ✅ ML prediction + DB save
@app.post("/predictions")
def save_prediction(request: PredictionRequest):
    model_res = rf_sales_prediction(request)
    created_at = datetime.utcnow().isoformat()

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO predictions
        (productName, category, unitPrice, discount, region, season,
         predictedSales, confidenceLevel, growthTrend, insights, recommendation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        request.productName,
        request.category,
        request.unitPrice,
        request.discount,
        request.region,
        request.season,
        model_res["predictedSales"],
        model_res["confidenceLevel"],
        model_res["growthTrend"],
        json.dumps(model_res["insights"]),
        model_res["recommendation"],
        created_at
    ))

    conn.commit()
    cur.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT 1")
    row = dict(cur.fetchone())
    conn.close()

    row["insights"] = json.loads(row["insights"])
    return row

@app.get("/predictions")
def list_predictions(limit: int = 50):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    for r in rows:
        r["insights"] = json.loads(r["insights"])
    return rows

# ---------------- Analytics ----------------
@app.get("/analytics")
def analytics():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) as total FROM predictions")
    total_orders = cur.fetchone()["total"] or 0

    cur.execute("SELECT AVG(growthTrend) as avg_growth FROM predictions")
    growth_rate = round(cur.fetchone()["avg_growth"] or 0, 1)

    cur.execute("SELECT category, COUNT(*) as cnt FROM predictions GROUP BY category")
    categories = [{"name": r["category"], "value": r["cnt"]} for r in cur.fetchall()]

    cur.execute("""
        SELECT region, SUM(predictedSales) as sales, AVG(growthTrend) as growth
        FROM predictions GROUP BY region
    """)
    regions = [
        {"name": r["region"], "sales": float(r["sales"]), "growth": round(r["growth"], 1)}
        for r in cur.fetchall()
    ]

    conn.close()

    return {
        "growthRate": growth_rate,
        "activeCustomers": total_orders * 5,
        "totalOrders": total_orders,
        "categories": categories,
        "regions": regions,
        "monthlyOrders": []
    }

# ---------------- File Upload ----------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = os.path.basename(file.filename)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    path = os.path.join(UPLOAD_DIR, f"{timestamp}_{filename}")

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"status": "ok", "path": f"uploads/{os.path.basename(path)}"}

# ---------------- Settings ----------------
@app.get("/settings")
def get_settings():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT payload FROM settings WHERE id = 1")
    payload = json.loads(cur.fetchone()["payload"])
    conn.close()
    return {"payload": payload}

@app.put("/settings")
def update_settings(payload: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE settings SET payload = ?, updated_at = ? WHERE id = 1",
        (json.dumps(payload), datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}

# ---------------- Run ----------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
