# backend/main.py
import os
import sqlite3
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import shutil
import json

DB_PATH = os.path.join(os.path.dirname(__file__), "app_data.db")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Sales Forecasting API", version="1.0.0")

# Enable CORS for local development (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- DB helpers ----------
def get_conn():
    conn = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
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
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            payload TEXT,
            updated_at TEXT
        )
        """
    )
    # ensure a default settings row exists
    cur.execute("SELECT COUNT(1) as c FROM settings")
    if cur.fetchone()["c"] == 0:
        default_payload = json.dumps({
            "profile": {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john.doe@example.com",
                "company": "Example Co"
            },
            "model": {
                "predictionModel": "advanced",
                "defaultPeriod": 30,
                "confidenceThreshold": 85
            },
            "notifications": {
                "email": True,
                "weekly": True,
                "lowAccuracy": True
            },
            "data": {
                "autoUpdate": True,
                "retentionYears": 2
            }
        })
        cur.execute(
            "INSERT INTO settings (id, payload, updated_at) VALUES (1, ?, ?)",
            (default_payload, datetime.utcnow().isoformat()),
        )
    conn.commit()
    conn.close()


init_db()


# ---------- Pydantic models ----------
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
    growthTrend: float  # percent
    insights: List[str]
    recommendation: str


# ---------- Simple heuristic sales model ----------
def simple_sales_model(data: PredictionRequest) -> PredictionResponse:
    category_base = {
        "electronics": 32000,
        "clothing": 18000,
        "grocery": 25000,
        "furniture": 22000,
    }
    base = category_base.get(data.category.lower(), 20000)

    # Price effect
    price_factor = max(0.5, min(1.5, 1.0 - (data.unitPrice - 100) / 1000))

    # Discount effect (20% discount ~ 16% more sales)
    discount_factor = 1 + (data.discount / 100) * 0.8

    region_factor = {
        "north": 1.05,
        "south": 0.95,
        "east": 1.00,
        "west": 1.10,
    }.get(data.region.lower(), 1.0)

    season_factor = {
        "summer": 1.10,
        "winter": 1.15,
        "spring": 1.05,
        "autumn": 0.90,
        "monsoon": 1.08,
    }.get(data.season.lower(), 1.0)

    predicted = base * price_factor * discount_factor * region_factor * season_factor

    # Growth trend & confidence heuristic
    if discount_factor > 1.1 and season_factor >= 1.1:
        growth_trend = 0.20
        confidence = "High"
    elif discount_factor > 1.05:
        growth_trend = 0.12
        confidence = "Medium"
    else:
        growth_trend = 0.05
        confidence = "Medium"

    insights: List[str] = []
    if data.discount >= 20:
        insights.append("Strong promotional impact due to high discount.")
    elif data.discount > 0:
        insights.append("Moderate uplift expected from discount strategy.")
    else:
        insights.append("No discount applied; rely on baseline demand and seasonality.")

    if season_factor > 1.05:
        insights.append("Strong seasonal demand expected in this period.")
    elif season_factor < 1.0:
        insights.append("Off-season period; consider targeted campaigns.")

    if region_factor > 1.05:
        insights.append("Region shows above-average performance historically.")
    elif region_factor < 1.0:
        insights.append("Region historically underperforms; conservative forecast applied.")

    if price_factor < 0.8:
        insights.append("High unit price may limit demand; consider adjusting pricing.")
    elif price_factor > 1.2:
        insights.append("Competitive pricing likely to support higher volume.")

    recommendation = "Increase stock levels to meet predicted demand."
    if growth_trend < 0.08:
        recommendation = "Maintain current stock levels and monitor performance."
    if growth_trend >= 0.18:
        recommendation = "Strong growth expected; aggressively increase stock and marketing."

    return PredictionResponse(
        predictedSales=round(predicted, 2),
        confidenceLevel=confidence,
        growthTrend=round(growth_trend * 100, 1),
        insights=insights,
        recommendation=recommendation,
    )


# ---------- Endpoints ----------
@app.get("/")
def root():
    return {"status": "ok", "message": "Sales forecasting API is running."}


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    """
    Return a heuristic prediction (does NOT persist).
    Frontend should call POST /predictions to persist the prediction.
    """
    return simple_sales_model(request)


@app.post("/predictions")
def save_prediction(request: PredictionRequest):
    """
    Accepts the same fields as PredictionRequest.
    Runs the model, saves the result to DB, and returns the full saved row.
    """
    model_res = simple_sales_model(request)
    created_at = datetime.utcnow().isoformat()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO predictions
        (productName, category, unitPrice, discount, region, season, predictedSales, confidenceLevel, growthTrend, insights, recommendation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            request.productName,
            request.category,
            request.unitPrice,
            request.discount,
            request.region,
            request.season,
            model_res.predictedSales,
            model_res.confidenceLevel,
            model_res.growthTrend,
            json.dumps(model_res.insights),
            model_res.recommendation,
            created_at,
        ),
    )
    created_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM predictions WHERE id = ?", (created_id,))
    row = cur.fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=500, detail="Failed to save prediction")

    # format the response as JSON-friendly
    saved = dict(row)
    saved["insights"] = json.loads(saved["insights"]) if saved.get("insights") else []
    return saved


@app.get("/predictions")
def list_predictions(limit: int = 50):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    for r in rows:
        r["insights"] = json.loads(r["insights"]) if r.get("insights") else []
    return rows


@app.get("/analytics")
def analytics():
    """
    Returns analytics JSON in the format you provided:
    {
      "growthRate": 24.5,
      "activeCustomers": 12458,
      "totalOrders": 8392,
      "categories": [{"name":"Electronics","value":36}, ...],
      "regions": [{"name":"North","sales":45000,"growth":12}, ...],
      "monthlyOrders": [{"month":"Jan","orders":280}, ...]
    }
    Values are computed from the predictions table.
    """
    conn = get_conn()
    cur = conn.cursor()

    # total orders = number of prediction records
    cur.execute("SELECT COUNT(1) as cnt FROM predictions")
    total_orders = cur.fetchone()["cnt"] or 0

    # active customers heuristic: approximate as distinct product names * factor
    cur.execute("SELECT COUNT(DISTINCT productName) as distinct_products FROM predictions")
    distinct_products = cur.fetchone()["distinct_products"] or 0
    active_customers = distinct_products * 10  # heuristic multiplier (you can change later)

    # average growth rate (use growthTrend column which stores percent e.g. 5.0)
    cur.execute("SELECT AVG(growthTrend) as avg_growth FROM predictions")
    avg_growth = cur.fetchone()["avg_growth"] or 0.0

    # categories aggregation (count of predictions per category)
    cur.execute("SELECT category, COUNT(1) as cnt FROM predictions GROUP BY category ORDER BY cnt DESC")
    categories = [{"name": row["category"], "value": int(row["cnt"])} for row in cur.fetchall()]

    # regions aggregation: total predictedSales and average growth
    cur.execute(
        "SELECT region, SUM(predictedSales) as total_sales, AVG(growthTrend) as avg_growth FROM predictions GROUP BY region ORDER BY total_sales DESC"
    )
    regions = []
    for row in cur.fetchall():
        regions.append(
            {
                "name": row["region"],
                "sales": float(row["total_sales"] or 0.0),
                "growth": round(float(row["avg_growth"] or 0.0), 1),
            }
        )

    # monthly orders: group by YYYY-MM from created_at
    cur.execute(
        "SELECT substr(created_at,1,7) as ym, COUNT(1) as cnt FROM predictions GROUP BY ym ORDER BY ym ASC"
    )
    monthly_raw = cur.fetchall()
    # convert "YYYY-MM" to month name short (Jan, Feb) and orders
    monthlyOrders = []
    for row in monthly_raw:
        ym = row["ym"]
        try:
            dt = datetime.fromisoformat(ym + "-01")
            month_label = dt.strftime("%b")
        except Exception:
            month_label = ym
        monthlyOrders.append({"month": month_label, "orders": int(row["cnt"])})

    conn.close()

    analytics_payload = {
        "growthRate": round(float(avg_growth or 0.0), 1),
        "activeCustomers": int(active_customers),
        "totalOrders": int(total_orders),
        "categories": categories,
        "regions": regions,
        "monthlyOrders": monthlyOrders,
    }

    return analytics_payload


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Save uploaded file to backend/uploads/ and return saved path.
    """
    # sanitize filename minimally
    filename = os.path.basename(file.filename)
    if not filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    saved_name = f"{timestamp}_{filename}"
    saved_path = os.path.join(UPLOAD_DIR, saved_name)

    try:
        with open(saved_path, "wb") as out_file:
            shutil.copyfileobj(file.file, out_file)
    finally:
        file.file.close()

    return {"status": "ok", "path": f"uploads/{saved_name}"}


@app.get("/settings")
def get_settings():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT payload FROM settings WHERE id = 1")
    row = cur.fetchone()
    conn.close()
    if not row:
        return {}
    try:
        return {"payload": json.loads(row["payload"])}
    except Exception:
        return {"payload": row["payload"]}


@app.put("/settings")
def put_settings(payload: dict):
    """
    Expects { "payload": { ... } } or raw settings object.
    """
    data = payload.get("payload", payload)
    serialized = json.dumps(data)
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE settings SET payload = ?, updated_at = ? WHERE id = 1",
        (serialized, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "payload": data}


# ---------- run guard (only when executed directly) ----------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
