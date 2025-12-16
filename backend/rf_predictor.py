from ml_model import load_model

_bundle = load_model()
model = _bundle["model"]
enc_category = _bundle["enc_category"]
enc_region = _bundle["enc_region"]
enc_season = _bundle["enc_season"]

def rf_sales_prediction(data):
    X = [[
        enc_category.transform([data.category.lower()])[0],
        data.unitPrice,
        data.discount,
        enc_region.transform([data.region.lower()])[0],
        enc_season.transform([data.season.lower()])[0],
    ]]

    prediction = model.predict(X)[0]

    # interpretation layer (same output format)
    if data.discount >= 20:
        confidence = "High"
        growth = 18.0
    elif data.discount > 5:
        confidence = "Medium"
        growth = 10.0
    else:
        confidence = "Medium"
        growth = 5.0

    insights = [
        "Prediction generated using Random Forest regression model.",
        "Model learned price, discount, region, and season patterns.",
        "Higher discount positively impacts demand."
    ]

    recommendation = "Maintain stock levels."
    if growth >= 15:
        recommendation = "Increase inventory and marketing efforts."

    return {
        "predictedSales": round(float(prediction), 2),
        "confidenceLevel": confidence,
        "growthTrend": growth,
        "insights": insights,
        "recommendation": recommendation
    }
