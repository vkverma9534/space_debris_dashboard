import numpy as np
import pandas as pd

from analytics import risk_label, risk_level


def find_conjunctions(
    position_df,
    threshold,
    maximum_objects=700,
):
    if position_df.empty:
        return pd.DataFrame()

    sample = position_df.head(
        min(
            maximum_objects,
            len(position_df),
        )
    ).reset_index(drop=True)

    coords = sample[
        ["X", "Y", "Z"]
    ].to_numpy(dtype=float)

    names = sample[
        "OBJECT_NAME"
    ].to_numpy()

    categories = sample[
        "CATEGORY"
    ].to_numpy()

    ids = sample[
        "NORAD_CAT_ID"
    ].to_numpy()

    alerts = []

    for i in range(len(coords)):
        differences = (
            coords[i + 1:]
            - coords[i]
        )

        if len(differences) == 0:
            continue

        distances = np.linalg.norm(
            differences,
            axis=1,
        )

        close_indices = np.where(
            distances <= threshold
        )[0]

        for relative_index in close_indices:
            j = (
                i
                + 1
                + relative_index
            )

            if "ISS" in names[i] and "ISS" in names[j]:
                continue

            distance = float(
                distances[
                    relative_index
                ]
            )

            alerts.append(
                {
                    "Object A": names[i],
                    "NORAD A": ids[i],
                    "Category A": categories[i],
                    "Object B": names[j],
                    "NORAD B": ids[j],
                    "Category B": categories[j],
                    "Est. Separation (km)": round(
                        distance,
                        3,
                    ),
                    "Risk Level": risk_level(
                        distance,
                        threshold,
                    ),
                    "Risk": risk_label(
                        distance,
                        threshold,
                    ),
                }
            )

    if not alerts:
        return pd.DataFrame()

    return (
        pd.DataFrame(alerts)
        .sort_values(
            "Est. Separation (km)"
        )
        .reset_index(drop=True)
    )


def calculate_risk_summary(
    conjunctions_df,
):
    if conjunctions_df.empty:
        return {
            "high": 0,
            "elevated": 0,
            "moderate": 0,
            "total": 0,
        }

    return {
        "high": int(
            (
                conjunctions_df[
                    "Risk Level"
                ] == 4
            ).sum()
        ),
        "elevated": int(
            (
                conjunctions_df[
                    "Risk Level"
                ] == 3
            ).sum()
        ),
        "moderate": int(
            (
                conjunctions_df[
                    "Risk Level"
                ] == 2
            ).sum()
        ),
        "total": len(
            conjunctions_df
        ),
    }


def get_closest_approaches(
    conjunctions_df,
    limit=12,
):
    if conjunctions_df.empty:
        return []

    display = conjunctions_df.head(
        limit
    )[
        [
            "Object A",
            "Object B",
            "Est. Separation (km)",
            "Risk",
        ]
    ].copy()

    display.columns = [
        "Object A",
        "Object B",
        "Separation",
        "Risk",
    ]

    return display.to_dict(
        orient="records"
    )