import numpy as np
import pandas as pd

from analytics import EARTH_RADIUS_KM


def simulate_positions(df, hours):
    """
    Generate simplified orbital positions.

    This preserves the simplified propagation model
    used by the original dashboard.
    """

    if df.empty:
        return pd.DataFrame(
            columns=[
                "OBJECT_NAME",
                "CATEGORY",
                "NORAD_CAT_ID",
                "X",
                "Y",
                "Z",
                "ALTITUDE",
            ]
        )

    work = df.copy()

    mean_motion = np.clip(
        work["MEAN_MOTION"].to_numpy(
            dtype=float
        ),
        0.01,
        20,
    )

    altitude = work[
        "APPROX_ALTITUDE"
    ].to_numpy(dtype=float)

    radius = (
        EARTH_RADIUS_KM
        + np.nan_to_num(
            altitude,
            nan=500.0,
            posinf=1500.0,
            neginf=200.0,
        )
    )

    initial_angle = work[
        "MEAN_ANOMALY"
    ].to_numpy(dtype=float)

    angle = (
        initial_angle
        + mean_motion * hours * 15
    )

    angle_rad = np.radians(angle)

    inclination_rad = np.radians(
        work["INCLINATION"].to_numpy(
            dtype=float
        )
    )

    x = radius * np.cos(angle_rad)
    y = radius * np.sin(angle_rad)

    z = (
        radius
        * np.sin(inclination_rad)
        * np.sin(angle_rad)
    )

    result = work[
        [
            "OBJECT_NAME",
            "CATEGORY",
            "NORAD_CAT_ID",
        ]
    ].copy()

    result["X"] = x
    result["Y"] = y
    result["Z"] = z
    result["ALTITUDE"] = altitude

    return result


def make_earth():
    """Generate coordinates for the Earth sphere."""

    theta = np.linspace(
        0,
        2 * np.pi,
        50,
    )

    phi = np.linspace(
        0,
        np.pi,
        30,
    )

    x = EARTH_RADIUS_KM * np.outer(
        np.cos(theta),
        np.sin(phi),
    )

    y = EARTH_RADIUS_KM * np.outer(
        np.sin(theta),
        np.sin(phi),
    )

    z = EARTH_RADIUS_KM * np.outer(
        np.ones_like(theta),
        np.cos(phi),
    )

    return x, y, z


def get_3d_sample(
    positions_df,
    maximum_objects=700,
):
    """Return a reproducible sample for 3D visualization."""

    if positions_df.empty:
        return positions_df.copy()

    return positions_df.sample(
        min(
            maximum_objects,
            len(positions_df),
        ),
        random_state=42,
    )