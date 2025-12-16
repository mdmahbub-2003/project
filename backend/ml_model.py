import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "rf_model.pkl")

enc_category = LabelEncoder()
enc_region = LabelEncoder()
enc_season = LabelEncoder()

def train_model():
    data = {
        "category": ["electronics", "clothing", "grocery", "furniture"] * 50,
        "unitPrice": np.random.randint(100, 1200, 200),
        "discount": np.random.randint(0, 40, 200),
        "region": ["north", "south", "east", "west"] * 50,
        "season": ["summer", "winter", "monsoon", "spring"] * 50,
        "sales": np.random.randint(15000, 60000, 200),
    }

    df = pd.DataFrame(data)

    df["category"] = enc_category.fit_transform(df["category"])
    df["region"] = enc_region.fit_transform(df["region"])
    df["season"] = enc_season.fit_transform(df["season"])

    X = df.drop("sales", axis=1)
    y = df["sales"]

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    joblib.dump(
        {
            "model": model,
            "enc_category": enc_category,
            "enc_region": enc_region,
            "enc_season": enc_season,
        },
        MODEL_PATH
    )

def load_model():
    if not os.path.exists(MODEL_PATH):
        train_model()
    return joblib.load(MODEL_PATH)
