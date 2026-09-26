#!/usr/bin/env python3

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb

from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from feature_schema import (
    LABEL_COLUMNS,
    THREAT_CLASS_NAMES,
    THREAT_FEATURES,
    validate_feature_csv_columns,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Evaluate trained models on a labelled feature CSV."
    )
    parser.add_argument("--features", required=True)
    parser.add_argument("--models", default="artifacts")
    parser.add_argument(
        "--output",
        default="artifacts/evaluation_report.json",
    )
    return parser.parse_args()


def numeric_matrix(data, feature_names):
    matrix = data[feature_names].copy()

    for column in feature_names:
        matrix[column] = pd.to_numeric(matrix[column], errors="coerce")

    matrix = matrix.replace([np.inf, -np.inf], np.nan).fillna(0.0)
    return matrix.astype(np.float32)


def main():
    args = parse_args()
    feature_path = Path(args.features)
    model_dir = Path(args.models)
    output_path = Path(args.output)

    data = pd.read_csv(feature_path)
    validate_feature_csv_columns(data.columns)

    with (model_dir / "thresholds.json").open(
        "r",
        encoding="utf-8",
    ) as file:
        thresholds = json.load(file)

    report = {
        "feature_csv": str(feature_path),
        "models_directory": str(model_dir),
        "classes": {},
    }

    for threat_key, feature_names in THREAT_FEATURES.items():
        label_column = LABEL_COLUMNS[threat_key]
        model_path = model_dir / f"{threat_key}.json"

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        model = xgb.XGBClassifier()
        model.load_model(model_path)

        probabilities = model.predict_proba(
            numeric_matrix(data, feature_names)
        )[:, 1]

        threshold = float(thresholds[threat_key]["threshold"])
        predictions = (probabilities >= threshold).astype(int)
        labels = data[label_column].astype(int).to_numpy()

        tn, fp, fn, tp = confusion_matrix(
            labels,
            predictions,
            labels=[0, 1],
        ).ravel()

        # The denominator uses total duration represented by observation
        # windows. Replace this with an exact capture duration if your CSV
        # contains repeated or overlapping windows.
        duration_column = "observation_window_seconds"
        if duration_column in data.columns:
            total_hours = (
                pd.to_numeric(data[duration_column], errors="coerce")
                .fillna(0)
                .sum()
                / 3600.0
            )
        else:
            total_hours = 0.0

        false_alerts_per_hour = (
            float(fp / total_hours)
            if total_hours > 0
            else None
        )

        report["classes"][threat_key] = {
            "threat_class": THREAT_CLASS_NAMES[threat_key],
            "threshold": threshold,
            "precision": float(
                precision_score(labels, predictions, zero_division=0)
            ),
            "recall": float(
                recall_score(labels, predictions, zero_division=0)
            ),
            "f1": float(
                f1_score(labels, predictions, zero_division=0)
            ),
            "confusion_matrix": {
                "true_negative": int(tn),
                "false_positive": int(fp),
                "false_negative": int(fn),
                "true_positive": int(tp),
            },
            "false_alerts_per_hour": false_alerts_per_hour,
            "rows": int(len(data)),
        }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as file:
        json.dump(report, file, indent=2)

    print(json.dumps(report, indent=2))
    print(f"\nSaved evaluation report: {output_path.resolve()}")


if __name__ == "__main__":
    main()