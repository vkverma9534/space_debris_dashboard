import numpy as np
import pandas as pd


EARTH_RADIUS_KM = 6378.137
EARTH_MU_KM3_S2 = 398600.4418


DATASETS = {
    "Active Satellite": "data/active_satellites.csv",
    "Space Station": "data/active_space_station.csv",
    "Starlink": "data/starlink.csv",
    "OneWeb": "data/oneweb.csv",
    "Kuiper": "data/kuiper.csv",
    "Debris - Chinese ASAT": "data/Chinese_ASAT_Test_Debris.csv",
    "Debris - Iridium 33": "data/IRIDIUM_33_Debris.csv",
    "Debris - Cosmos 2251": "data/COSMOS_2251_Debris.csv",
}


def load_data():
    """Load and combine all orbital datasets."""

    frames = []
    missing_files = []

    for category, filename in DATASETS.items():
        try:
            df = pd.read_csv(filename)
            df["CATEGORY"] = category
            frames.append(df)
        except FileNotFoundError:
            missing_files.append(filename)

    if not frames:
        return pd.DataFrame(), missing_files

    master_df = pd.concat(frames, ignore_index=True)

    numeric_columns = [
        "MEAN_MOTION",
        "ECCENTRICITY",
        "INCLINATION",
        "MEAN_ANOMALY",
    ]

    for column in numeric_columns:
        if column in master_df.columns:
            master_df[column] = pd.to_numeric(
                master_df[column],
                errors="coerce",
            )

    if "OBJECT_NAME" not in master_df.columns:
        raise ValueError("OBJECT_NAME column is missing.")

    master_df["OBJECT_NAME"] = (
        master_df["OBJECT_NAME"]
        .fillna("Unknown Object")
        .astype(str)
    )

    if "NORAD_CAT_ID" not in master_df.columns:
        master_df["NORAD_CAT_ID"] = ""

    if "ECCENTRICITY" not in master_df.columns:
        master_df["ECCENTRICITY"] = 0.0

    master_df = master_df.dropna(
        subset=[
            "MEAN_MOTION",
            "INCLINATION",
            "MEAN_ANOMALY",
        ]
    ).copy()

    master_df["APPROX_ALTITUDE"] = altitude_from_mean_motion(
        master_df["MEAN_MOTION"]
    )

    master_df = master_df.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    return master_df, missing_files


def altitude_from_mean_motion(mean_motion):
    """Estimate orbital altitude from mean motion."""

    n_rev_day = pd.to_numeric(
        mean_motion,
        errors="coerce",
    ).to_numpy(dtype=float)

    n_rad_sec = n_rev_day * 2 * np.pi / 86400

    altitude = np.full(
        len(n_rad_sec),
        np.nan,
    )

    valid = n_rad_sec > 0

    altitude[valid] = (
        EARTH_MU_KM3_S2 /
        n_rad_sec[valid] ** 2
    ) ** (1 / 3) - EARTH_RADIUS_KM

    return altitude


def filter_categories(df, categories=None):
    """Filter objects by selected categories."""

    if categories is None:
        return df.copy()

    return df[
        df["CATEGORY"].isin(categories)
    ].copy()


def calculate_metrics(df):
    """Calculate dashboard summary metrics."""

    total_objects = len(df)

    debris_count = int(
        df["CATEGORY"]
        .str.contains(
            "Debris",
            case=False,
            na=False,
        )
        .sum()
    )

    active_count = total_objects - debris_count

    leo_count = int(
        df["APPROX_ALTITUDE"].between(
            160,
            2000,
        ).sum()
    )

    return {
        "total": total_objects,
        "visible": total_objects,
        "active": active_count,
        "debris": debris_count,
        "leo": leo_count,
    }


def altitude_distribution(df):
    """Create altitude-band statistics."""

    altitude_df = df[
        df["APPROX_ALTITUDE"].between(
            150,
            2000,
        )
    ].copy()

    if altitude_df.empty:
        return pd.DataFrame(
            columns=[
                "Altitude Band",
                "Objects",
            ]
        )

    altitude_df["Altitude Band"] = (
        np.floor(
            altitude_df["APPROX_ALTITUDE"] / 100
        ) * 100
    )

    return (
        altitude_df
        .groupby("Altitude Band")
        .size()
        .reset_index(name="Objects")
    )


def risk_label(distance_km, threshold):
    """Return human-readable conjunction risk."""

    if distance_km <= threshold * 0.25:
        return "HIGH"

    if distance_km <= threshold * 0.5:
        return "ELEVATED"

    if distance_km <= threshold:
        return "MODERATE"

    return "LOW"


def risk_level(distance_km, threshold):
    """Return numerical risk level."""

    if distance_km <= threshold * 0.25:
        return 4

    if distance_km <= threshold * 0.5:
        return 3

    if distance_km <= threshold:
        return 2

    return 1