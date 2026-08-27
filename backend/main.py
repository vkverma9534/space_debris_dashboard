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


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Space Debris & Collision Risk API",
    description=(
        "Backend API for the custom "
        "Space Situational Awareness dashboard."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATA DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Your repository structure is:
#
# space_debris_dashboard/
# └── backend/
#     ├── api/
#     │   └── index.py
#     ├── backend/
#     │   └── data/
#     │       ├── active_space_station.csv
#     │       ├── Chinese_ASAT_Test_Debris.csv
#     │       ├── COSMOS_2251_Debris.csv
#     │       ├── IRIDIUM_33_Debris.csv
#     │       ├── kuiper.csv
#     │       ├── oneweb.csv
#     │       └── starlink.csv
#     ├── analytics.py
#     ├── conjunction.py
#     ├── main.py
#     └── orbital.py
#
# Therefore:
# BASE_DIR = .../space_debris_dashboard/backend
# DATA_DIR = .../space_debris_dashboard/backend/backend/data

DATA_DIR = os.path.join(
    BASE_DIR,
    "backend",
    "data"
)

os.makedirs(DATA_DIR, exist_ok=True)


# ============================================================
# DATASETS
# ============================================================

TLE_DATASETS = {
    "active_satellites.csv": "active",
    "active_space_station.csv": "stations",
    "starlink.csv": "starlink",
    "oneweb.csv": "oneweb",
    "kuiper.csv": "kuiper",
    "Chinese_ASAT_Test_Debris.csv": "fengyun-1c-debris",
    "IRIDIUM_33_Debris.csv": "iridium-33-debris",
    "COSMOS_2251_Debris.csv": "cosmos-2251-debris",
}


# ============================================================
# GLOBAL DATA
# ============================================================

master_df = pd.DataFrame()
missing_files = []


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup_event():

    global master_df, missing_files

    print("Initializing satellite and debris datasets...")
    print(f"BASE_DIR: {BASE_DIR}")
    print(f"DATA_DIR: {DATA_DIR}")

    # --------------------------------------------------------
    # Check datasets
    # --------------------------------------------------------

    for filename, group_name in TLE_DATASETS.items():

        file_path = os.path.join(
            DATA_DIR,
            filename
        )

        # ----------------------------------------------------
        # If the file already exists, use it.
        # ----------------------------------------------------

        if (
            os.path.exists(file_path)
            and os.path.getsize(file_path) > 0
        ):
            print(
                f"Using local dataset: {filename}"
            )
            continue

        # ----------------------------------------------------
        # Otherwise try to download it.
        # ----------------------------------------------------

        url = (
            "https://celestrak.org/NORAD/elements/"
            f"gp.php?GROUP={group_name}&FORMAT=csv"
        )

        try:

            print(
                f"Attempting to download {filename}..."
            )

            response = requests.get(
                url,
                timeout=30
            )

            if response.status_code == 200:

                with open(
                    file_path,
                    "w",
                    encoding="utf-8"
                ) as f:

                    f.write(response.text)

                print(
                    f"Downloaded {filename}"
                )

            else:

                print(
                    f"Failed to download "
                    f"{filename}: HTTP "
                    f"{response.status_code}"
                )

        except Exception as e:

            print(
                f"Skipping download for "
                f"{filename}. "
                f"Using local fallback. "
                f"Error: {e}"
            )

    # --------------------------------------------------------
    # Load all datasets
    # --------------------------------------------------------

    master_df, missing_files = load_data()

    print(
        f"Startup complete. "
        f"Loaded {len(master_df)} orbital records."
    )

    if missing_files:

        print(
            "Missing datasets:"
        )

        for file in missing_files:

            print(
                f"  - {file}"
            )


# ============================================================
# UPDATE TLE DATA
# ============================================================

@app.get("/api/cron/update-tle")
def update_tle_csvs():

    global master_df, missing_files

    for filename, group_name in TLE_DATASETS.items():

        url = (
            "https://celestrak.org/NORAD/elements/"
            f"gp.php?GROUP={group_name}&FORMAT=csv"
        )

        file_path = os.path.join(
            DATA_DIR,
            filename
        )

        try:

            response = requests.get(
                url,
                timeout=30
            )

            if response.status_code == 200:

                with open(
                    file_path,
                    "w",
                    encoding="utf-8"
                ) as f:

                    f.write(response.text)

        except Exception:

            pass

    # Reload datasets after update

    master_df, missing_files = load_data()

    return {
        "status": "success"
    }


# ============================================================
# REQUEST MODEL
# ============================================================

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


# ============================================================
# JSON SAFETY
# ============================================================

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


# ============================================================
# DATAFRAME -> RECORDS
# ============================================================

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


# ============================================================
# ORBITAL OBJECTS
# ============================================================

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


# ============================================================
# DENSITY POINTS
# ============================================================

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
            "APPROX_ALTITUDE": "altitude",
            "INCLINATION": "inclination",
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


# ============================================================
# DEBRIS ALTITUDE
# ============================================================

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
            "Altitude Band": "altitude"
        }
    )

    return dataframe_records(
        result
    )


# ============================================================
# DEBRIS SOURCES
# ============================================================

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


# ============================================================
# ROOT ENDPOINT
# ============================================================

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


# ============================================================
# HEALTH CHECK
# ============================================================

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


# ============================================================
# CATEGORIES
# ============================================================

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


# ============================================================
# DASHBOARD
# ============================================================

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

    # --------------------------------------------------------
    # Filter categories
    # --------------------------------------------------------

    filtered_df = filter_categories(
        master_df,
        request.categories,
    )

    # --------------------------------------------------------
    # Metrics
    # --------------------------------------------------------

    metrics = calculate_metrics(
        filtered_df
    )

    # --------------------------------------------------------
    # Altitude distribution
    # --------------------------------------------------------

    altitude_df = altitude_distribution(
        filtered_df
    )

    # --------------------------------------------------------
    # Density points
    # --------------------------------------------------------

    density_points = get_density_points(
        filtered_df
    )

    # --------------------------------------------------------
    # Orbital objects
    # --------------------------------------------------------

    orbital_objects = get_orbital_objects(
        filtered_df
    )

    # --------------------------------------------------------
    # Simulate orbital positions
    # --------------------------------------------------------

    positions_df = simulate_positions(
        filtered_df,
        request.hours_ahead,
    )

    # --------------------------------------------------------
    # Find conjunctions
    # --------------------------------------------------------

    conjunctions_df = find_conjunctions(
        positions_df,
        request.threshold_km,
        maximum_objects=request.objects_3d,
    )

    # --------------------------------------------------------
    # Risk summary
    # --------------------------------------------------------

    risk_summary = calculate_risk_summary(
        conjunctions_df
    )

    # --------------------------------------------------------
    # Closest approaches
    # --------------------------------------------------------

    closest_approaches = (
        get_closest_approaches(
            conjunctions_df
        )
    )

    # --------------------------------------------------------
    # Debris altitude
    # --------------------------------------------------------

    debris_altitude = (
        get_debris_altitude(
            filtered_df
        )
    )

    # --------------------------------------------------------
    # Debris sources
    # --------------------------------------------------------

    debris_sources = (
        get_debris_sources(
            filtered_df
        )
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

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


# ============================================================
# ORBITAL POSITIONS
# ============================================================

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

    # --------------------------------------------------------
    # Filter categories
    # --------------------------------------------------------

    filtered_df = filter_categories(
        master_df,
        request.categories,
    )

    # --------------------------------------------------------
    # Simulate positions
    # --------------------------------------------------------

    positions_df = simulate_positions(
        filtered_df,
        request.hours_ahead,
    )

    # --------------------------------------------------------
    # Select 3D sample
    # --------------------------------------------------------

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


# ============================================================
# CATALOG
# ============================================================

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