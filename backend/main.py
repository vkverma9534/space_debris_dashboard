import os
from concurrent.futures import ThreadPoolExecutor
from threading import Thread

import requests
import pandas as pd
import numpy as np

from fastapi import FastAPI, HTTPException, Response
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


configured_origins = os.environ.get(
    "FRONTEND_URLS",
    "",
).strip()

allowed_origins = (
    [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]
    if configured_origins
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=bool(configured_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)


if os.environ.get("VERCEL"):

    @app.middleware("http")
    async def vercel_api_prefix(request, call_next):

        original_path = request.scope.get("path", "")

        if (
            original_path != "/api"
            and not original_path.startswith("/api/")
        ):
            request.scope["path"] = "/api" + original_path

        response = await call_next(request)

        return response


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "backend",
    "data"
)

os.makedirs(
    DATA_DIR,
    exist_ok=True
)


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


master_df = pd.DataFrame()
missing_files = []
data_source_status = "unknown"


def get_celestrak_url(group_name):

    return (
        "https://celestrak.org/NORAD/elements/"
        f"gp.php?GROUP={group_name}&FORMAT=csv"
    )


def get_mirror_url(group_name):

    return (
        "https://raw.githubusercontent.com/"
        "satvisorcom/satvisor-data/master/"
        "celestrak/json/"
        f"{group_name}.json"
    )


def convert_mirror_json_to_csv(
    data,
    file_path,
):

    if isinstance(data, dict):

        if "data" in data:
            data = data["data"]

        elif "objects" in data:
            data = data["objects"]

        elif "satellites" in data:
            data = data["satellites"]

        else:
            data = [data]

    if not isinstance(data, list):
        return False

    rows = []

    for item in data:

        if not isinstance(item, dict):
            continue

        row = {}

        for key, value in item.items():

            if isinstance(value, dict):
                continue

            row[key.upper()] = value

        if "OBJECT_NAME" not in row:

            for key in [
                "OBJECT",
                "NAME",
                "SATELLITE_NAME",
            ]:

                if key in row:
                    row["OBJECT_NAME"] = row[key]
                    break

        if "NORAD_CAT_ID" not in row:

            for key in [
                "NORAD_CAT_ID",
                "NORAD_ID",
                "CATALOG_NUMBER",
                "NORAD_CATID",
            ]:

                if key in row:
                    row["NORAD_CAT_ID"] = row[key]
                    break

        rows.append(row)

    if not rows:
        return False

    df = pd.DataFrame(rows)

    required_columns = [
        "OBJECT_NAME",
        "MEAN_MOTION",
        "ECCENTRICITY",
        "INCLINATION",
        "MEAN_ANOMALY",
    ]

    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:
        return False

    if "NORAD_CAT_ID" not in df.columns:
        df["NORAD_CAT_ID"] = ""

    df.to_csv(
        file_path,
        index=False
    )

    return True


def download_from_celestrak(
    filename,
    group_name,
):

    file_path = os.path.join(
        DATA_DIR,
        filename
    )

    url = get_celestrak_url(
        group_name
    )

    try:

        print(
            f"Trying CelesTrak: {filename}"
        )

        response = requests.get(
            url,
            timeout=(5, 10),
            headers={
                "User-Agent":
                    "Mozilla/5.0"
            }
        )

        response.raise_for_status()

        content = response.text.strip()

        if not content:
            return False

        with open(
            file_path,
            "w",
            encoding="utf-8"
        ) as f:

            f.write(content)

        print(
            f"CelesTrak download successful: "
            f"{filename}"
        )

        return True

    except Exception as e:

        print(
            f"CelesTrak failed for "
            f"{filename}: {e}"
        )

        return False


def download_from_mirror(
    filename,
    group_name,
):

    file_path = os.path.join(
        DATA_DIR,
        filename
    )

    url = get_mirror_url(
        group_name
    )

    try:

        print(
            f"Trying Satvisor mirror: {filename}"
        )

        response = requests.get(
            url,
            timeout=(5, 15),
            headers={
                "User-Agent":
                    "Mozilla/5.0"
            }
        )

        response.raise_for_status()

        data = response.json()

        success = convert_mirror_json_to_csv(
            data,
            file_path
        )

        if success:

            print(
                f"Satvisor mirror download "
                f"successful: {filename}"
            )

            return True

        print(
            f"Satvisor mirror data format "
            f"could not be converted: {filename}"
        )

        return False

    except Exception as e:

        print(
            f"Satvisor mirror failed for "
            f"{filename}: {e}"
        )

        return False


def download_or_use_local(
    filename,
    group_name,
):

    file_path = os.path.join(
        DATA_DIR,
        filename
    )

    if download_from_celestrak(
        filename,
        group_name
    ):

        return True

    if download_from_mirror(
        filename,
        group_name
    ):

        return True

    if (
        os.path.exists(file_path)
        and os.path.getsize(file_path) > 0
    ):

        print(
            f"Using local fallback: {filename}"
        )

        return True

    print(
        f"No source available for: {filename}"
    )

    return False


def download_fresh_dataset(
    item,
):

    filename, group_name = item

    downloaded = (
        download_from_celestrak(
            filename,
            group_name,
        )
        or download_from_mirror(
            filename,
            group_name,
        )
    )

    return "live" if downloaded else "missing"


def download_dataset_with_fallback(
    item,
):

    filename, group_name = item

    if download_from_celestrak(
        filename,
        group_name,
    ):
        return "live"

    if download_from_mirror(
        filename,
        group_name,
    ):
        return "live"

    file_path = os.path.join(
        DATA_DIR,
        filename,
    )

    if (
        os.path.exists(file_path)
        and os.path.getsize(file_path) > 0
    ):
        print(
            f"Using local fallback: {filename}"
        )
        return "fallback"

    print(
        f"No source available for: {filename}"
    )
    return "missing"


def refresh_datasets(
    require_fresh=False,
):

    downloader = (
        download_fresh_dataset
        if require_fresh
        else download_dataset_with_fallback
    )

    with ThreadPoolExecutor(
        max_workers=len(TLE_DATASETS),
    ) as executor:

        results = list(
            executor.map(
                downloader,
                TLE_DATASETS.items(),
            )
        )

    return {
        filename: status
        for (filename, _), status in zip(
            TLE_DATASETS.items(),
            results,
        )
    }


def summarize_data_source(results):

    statuses = set(results.values())

    if "missing" in statuses:
        return "unavailable"

    if "fallback" in statuses:
        return "fallback"

    return "live"


def refresh_in_background():

    global master_df
    global missing_files
    global data_source_status

    results = refresh_datasets()
    refreshed_df, refreshed_missing_files = load_data()

    master_df = refreshed_df
    missing_files = refreshed_missing_files
    data_source_status = summarize_data_source(results)

    print(
        f"Background refresh complete. "
        f"Source: {data_source_status}. "
        f"Loaded {len(master_df)} orbital records."
    )


@app.on_event("startup")
def startup_event():

    global master_df
    global missing_files
    global data_source_status

    print(
        "Initializing satellite and debris datasets..."
    )

    print(
        f"BASE_DIR: {BASE_DIR}"
    )

    print(
        f"DATA_DIR: {DATA_DIR}"
    )

    data_source_status = "refreshing"
    master_df, missing_files = load_data()

    print(
        f"Startup complete. "
        f"Loaded {len(master_df)} orbital records."
    )

    if missing_files:

        print("Missing datasets:")

        for file in missing_files:

            print(
                f"  - {file}"
            )

    Thread(
        target=refresh_in_background,
        daemon=True,
    ).start()


@app.get("/api/cron/update-tle")
def update_tle_csvs():

    global master_df
    global missing_files
    global data_source_status

    results = refresh_datasets()
    data_source_status = summarize_data_source(results)

    master_df, missing_files = load_data()

    return {
        "status": "success",
        "datasets": results,
        "objects": len(master_df),
        "missing_files": missing_files,
    }


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

    return make_json_safe(
        records
    )


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
        "data_source":
            data_source_status,
    }


@app.get("/api/categories")
def categories():

    if master_df.empty:

        return {
            "categories": [],
            "data_source": data_source_status,
        }

    return {
        "categories":
            sorted(
                master_df[
                    "CATEGORY"
                ]
                .dropna()
                .unique()
                .tolist()
            ),
        "data_source": data_source_status,
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


@app.get("/api/catalog/download")
def download_catalog():

    global master_df
    global missing_files
    global data_source_status

    results = refresh_datasets(
        require_fresh=True,
    )

    failed_datasets = [
        filename
        for filename, status in results.items()
        if status == "missing"
    ]

    if failed_datasets:

        data_source_status = "unavailable"

        raise HTTPException(
            status_code=503,
            detail={
                "message": (
                    "Fresh download unavailable. "
                    "No CSV was generated."
                ),
                "failed_datasets": failed_datasets,
            },
        )

    master_df, missing_files = load_data()
    data_source_status = "live"

    if master_df.empty:

        raise HTTPException(
            status_code=500,
            detail=(
                "No orbital datasets "
                "were loaded."
            ),
        )

    csv_content = master_df.to_csv(
        index=False
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                "attachment; "
                "filename=space-debris-catalog.csv"
            ),
            "X-Catalog-Objects": str(len(master_df)),
            "X-Catalog-Missing-Files": str(len(missing_files)),
            "X-Catalog-Source": data_source_status,
        },
    )