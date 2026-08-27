import os
import requests
import pandas as pd
import numpy as np

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from analytics import (
    load_data,
    filter_categories,
    calculate_metrics,
    altitude_distribution,
)

from orbital import (
    simulate_positions,
    get_3d_sample,
)

from conjunction import (
    find_conjunctions,
    calculate_risk_summary,
    get_closest_approaches,
)

app = FastAPI(
    title="Space Debris & Collision Risk API",
    description=(
        "Backend API for the custom "
        "Space Situational Awareness dashboard."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "/tmp/data" if os.environ.get("VERCEL") else "backend/data"
os.makedirs(DATA_DIR, exist_ok=True)

TLE_DATASETS = {
    "active_satellites.csv": "active",
    "active_space_station.csv": "stations",
    "starlink.csv": "starlink",
    "oneweb.csv": "oneweb",
    "kuiper.csv": "kuiper",
    "Chinese_ASAT_Test_Debris.csv": "fengyun-1c-debris",
    "IRIDIUM_33_Debris.csv": "iridium-33-debris",
    "COSMOS_2251_Debris.csv": "cosmos-2251-debris"
}

master_df = pd.DataFrame()
missing_files = []

@app.on_event("startup")
def startup_event():
    global master_df, missing_files
    print("Initializing satellite and debris datasets...")
    
    # Non-blocking check: only attempt download if local file is missing/empty, 
    # and use a short 5-second timeout to fast-fail if network is restricted.
    for filename, group_name in TLE_DATASETS.items():
        file_path = os.path.join(DATA_DIR, filename)
        
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            url = f"https://celestrak.org/NORAD/elements/gp.php?GROUP={group_name}&FORMAT=csv"
            try:
                print(f"Attempting to download {filename}...")
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(response.text)
            except Exception:
                print(f"Skipping download for {filename} (network restricted). Using local fallback.")
            
    master_df, missing_files = load_data()
    print(f"Startup complete. Loaded {len(master_df)} orbital records.")

@app.get("/api/cron/update-tle")
def update_tle_csvs():
    global master_df, missing_files
    
    for filename, group_name in TLE_DATASETS.items():
        url = f"https://celestrak.org/NORAD/elements/gp.php?GROUP={group_name}&FORMAT=csv"
        file_path = os.path.join(DATA_DIR, filename)
        
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(response.text)
        except Exception:
            pass
            
    master_df, missing_files = load_data()
    return {"status": "success"}

class DashboardRequest(BaseModel):
    categories: list[str] | None = None

    hours_ahead: int = Field(
        default=2,
        ge=1,
        le=12,
    )

    threshold_km: float = Field(
        default=10.0,
        ge=1.0,
        le=50.0,
    )

    objects_3d: int = Field(
        default=700,
        ge=100,
        le=1500,
    )

def make_json_safe(value):
    if isinstance(value, dict):
        return {
            key: make_json_safe(val)
            for key, val in value.items()
        }

    if isinstance(value, list):
        return [
            make_json_safe(item)
            for item in value
        ]

    if isinstance(value, tuple):
        return [
            make_json_safe(item)
            for item in value
        ]

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.floating):
        return float(value)

    if isinstance(value, np.bool_):
        return bool(value)

    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    return value

def dataframe_records(df):
    if df.empty:
        return []

    result = df.copy()

    result = result.where(
        pd.notnull(result),
        None,
    )

    records = result.to_dict(
        orient="records"
    )

    return make_json_safe(records)

def get_orbital_objects(df):
    columns = [
        "OBJECT_NAME",
        "CATEGORY",
        "NORAD_CAT_ID",
        "APPROX_ALTITUDE",
        "MEAN_MOTION",
        "ECCENTRICITY",
        "INCLINATION",
        "MEAN_ANOMALY",
    ]

    available_columns = [
        column
        for column in columns
        if column in df.columns
    ]

    result = df[
        available_columns
    ].copy()

    result = result.head(5000)

    if "APPROX_ALTITUDE" in result.columns:
        result["APPROX_ALTITUDE"] = (
            result["APPROX_ALTITUDE"]
            .round(1)
        )

    if "MEAN_MOTION" in result.columns:
        result["MEAN_MOTION"] = (
            result["MEAN_MOTION"]
            .round(4)
        )

    if "ECCENTRICITY" in result.columns:
        result["ECCENTRICITY"] = (
            result["ECCENTRICITY"]
            .round(6)
        )

    if "INCLINATION" in result.columns:
        result["INCLINATION"] = (
            result["INCLINATION"]
            .round(2)
        )

    return result

def get_density_points(df):
    density_df = df[
        df["APPROX_ALTITUDE"].between(
            150,
            2000,
        )
    ][
        [
            "APPROX_ALTITUDE",
            "INCLINATION",
        ]
    ].copy()

    density_df = density_df.dropna()

    density_df = density_df.rename(
        columns={
            "APPROX_ALTITUDE":
                "altitude",

            "INCLINATION":
                "inclination",
        }
    )

    if len(density_df) > 10000:
        density_df = density_df.sample(
            10000,
            random_state=42,
        )

    return dataframe_records(
        density_df
    )

def get_debris_altitude(df):
    debris_df = df[
        df["CATEGORY"].str.contains(
            "Debris",
            case=False,
            na=False,
        )
    ].copy()

    debris_df = debris_df[
        debris_df["APPROX_ALTITUDE"].between(
            150,
            2000,
        )
    ]

    if debris_df.empty:
        return []

    debris_df["Altitude Band"] = (
        (
            debris_df["APPROX_ALTITUDE"]
            // 100
        )
        * 100
    )

    result = (
        debris_df
        .groupby("Altitude Band")
        .size()
        .reset_index(
            name="objects"
        )
    )

    result = result.rename(
        columns={
            "Altitude Band":
                "altitude"
        }
    )

    return dataframe_records(
        result
    )

def get_debris_sources(df):
    debris_df = df[
        df["CATEGORY"].str.contains(
            "Debris",
            case=False,
            na=False,
        )
    ].copy()

    if debris_df.empty:
        return []

    result = (
        debris_df["CATEGORY"]
        .value_counts()
        .reset_index()
    )

    result.columns = [
        "source",
        "objects",
    ]

    return dataframe_records(
        result
    )

@app.get("/")
def root():
    return {
        "name":
            "Space Debris & Collision Risk API",

        "status":
            "online",

        "version":
            "1.0.0",
    }

@app.get("/api/health")
def health():
    return {
        "status":
            "ok",

        "objects":
            len(master_df),

        "missing_files":
            missing_files,
    }

@app.get("/api/categories")
def categories():
    if master_df.empty:
        return {
            "categories": []
        }

    return {
        "categories": sorted(
            master_df[
                "CATEGORY"
            ]
            .dropna()
            .unique()
            .tolist()
        )
    }

@app.post("/api/dashboard")
def dashboard(
    request: DashboardRequest,
):
    if master_df.empty:
        raise HTTPException(
            status_code=500,
            detail=(
                "No orbital datasets "
                "were loaded."
            ),
        )

    filtered_df = filter_categories(
        master_df,
        request.categories,
    )

    metrics = calculate_metrics(
        filtered_df
    )

    altitude_df = altitude_distribution(
        filtered_df
    )

    density_points = get_density_points(
        filtered_df
    )

    orbital_objects = get_orbital_objects(
        filtered_df
    )

    positions_df = simulate_positions(
        filtered_df,
        request.hours_ahead,
    )

    conjunctions_df = find_conjunctions(
        positions_df,
        request.threshold_km,
        maximum_objects=request.objects_3d,
    )

    risk_summary = calculate_risk_summary(
        conjunctions_df
    )

    closest_approaches = (
        get_closest_approaches(
            conjunctions_df
        )
    )

    debris_altitude = (
        get_debris_altitude(
            filtered_df
        )
    )

    debris_sources = (
        get_debris_sources(
            filtered_df
        )
    )

    return make_json_safe({
        "metrics":
            metrics,

        "altitude_distribution":
            dataframe_records(
                altitude_df
            ),

        "density_points":
            density_points,

        "risk_summary":
            risk_summary,

        "closest_approaches":
            closest_approaches,

        "conjunctions":
            dataframe_records(
                conjunctions_df.head(200)
            ),

        "orbital_objects":
            dataframe_records(
                orbital_objects
            ),

        "debris_altitude":
            debris_altitude,

        "debris_sources":
            debris_sources,

        "missing_files":
            missing_files,

        "settings": {
            "hours_ahead":
                request.hours_ahead,

            "threshold_km":
                request.threshold_km,

            "objects_3d":
                request.objects_3d,
        },
    })

@app.post("/api/orbital-positions")
def orbital_positions(
    request: DashboardRequest,
):
    if master_df.empty:
        raise HTTPException(
            status_code=500,
            detail=(
                "No orbital datasets "
                "were loaded."
            ),
        )

    filtered_df = filter_categories(
        master_df,
        request.categories,
    )

    positions_df = simulate_positions(
        filtered_df,
        request.hours_ahead,
    )

    sample = get_3d_sample(
        positions_df,
        request.objects_3d,
    )

    return make_json_safe({
        "objects":
            dataframe_records(
                sample
            )
    })

@app.get("/api/catalog")
def catalog(
    limit: int = 200,
):
    if master_df.empty:
        return {
            "objects": [],
            "total": 0,
        }

    limit = max(
        1,
        min(limit, 2000),
    )

    result = get_orbital_objects(
        master_df.head(limit)
    )

    return make_json_safe({
        "objects":
            dataframe_records(
                result
            ),

        "total":
            len(master_df),
    })