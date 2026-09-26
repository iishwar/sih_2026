#!/usr/bin/env python3

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb

from sklearn.metrics import f1_score
from sklearn.model_selection import GroupShuffleSplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from feature_schema import (
    LABEL_COLUMNS,
    METADATA_COLUMNS,
    THREAT_CLASS_NAMES,
    THREAT_FEATURES,
    validate_feature_csv_columns,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Train six independent binary XGBoost threat models."
    )
    parser.add_argument(
        "--features",
        required=True,
        help="CSV produced by the feature extractor; one row per labelled window.",
    )
    parser.add_argument(
        "--output",
        default="artifacts",
        help="Directory where model JSON files and thresholds are saved.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for repeatable splits and model training.",
    )
    return parser.parse_args()


def split_by_scenario(data, seed):
    """
    Split by scenario_id rather than random rows.

    This prevents near-duplicate windows from the same capture scenario
    appearing in both training and test data.
    """
    groups = data["scenario_id"].astype(str)

    first_split = GroupShuffleSplit(
        n_splits=1,
        test_size=0.30,
        random_state=seed,
    )
    train_indices, temporary_indices = next(
        first_split.split(data, groups=groups)
    )

    temporary = data.iloc[temporary_indices].reset_index(drop=True)
    temporary_groups = temporary["scenario_id"].astype(str)

    second_split = GroupShuffleSplit(
        n_splits=1,
        test_size=0.50,
        random_state=seed + 1,
    )
    validation_relative, test_relative = next(
        second_split.split(temporary, groups=temporary_groups)
    )

    validation_indices = temporary_indices[validation_relative]
    test_indices = temporary_indices[test_relative]

    return (
        data.iloc[train_indices].copy(),
        data.iloc[validation_indices].copy(),
        data.iloc[test_indices].copy(),
    )


def clean_numeric_features(frame, feature_names):
    """
    Convert features to numeric values and replace missing values with zero.

    Availability indicators, such as tls_metadata_available, must accompany
    any fields that can be absent. This lets a model distinguish unavailable
    metadata from a measured zero.
    """
    cleaned = frame[feature_names].copy()

    for name in feature_names:
        cleaned[name] = pd.to_numeric(cleaned[name], errors="coerce")

    cleaned = cleaned.replace([np.inf, -np.inf], np.nan)
    cleaned = cleaned.fillna(0.0)

    return cleaned.astype(np.float32)


def choose_threshold(labels, probabilities):
    """
    Choose the threshold with the highest validation F1 score.

    This threshold is selected using validation rows only. The test set is
    kept separate for the final report.
    """
    best_threshold = 0.50
    best_f1 = -1.0

    for threshold in np.arange(0.05, 0.96, 0.01):
        predictions = (probabilities >= threshold).astype(int)
        score = f1_score(labels, predictions, zero_division=0)

        if score > best_f1:
            best_f1 = float(score)
            best_threshold = float(threshold)

    return best_threshold, best_f1


def main():
    args = parse_args()
    input_path = Path(args.features)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise FileNotFoundError(f"Feature CSV not found: {input_path}")

    data = pd.read_csv(input_path)
    validate_feature_csv_columns(data.columns)

    if data.empty:
        raise ValueError("Feature CSV contains no rows.")

    if data["scenario_id"].isna().any():
        raise ValueError("scenario_id must be present for every row.")

    # Labels must be exactly binary. Do not silently infer missing labels.
    for label_column in LABEL_COLUMNS.values():
        values = set(data[label_column].dropna().unique())
        if not values.issubset({0, 1, False, True}):
            raise ValueError(
                f"{label_column} must contain only 0 or 1; found {values}"
            )
        if data[label_column].isna().any():
            raise ValueError(f"{label_column} contains missing labels.")

    train_data, validation_data, test_data = split_by_scenario(
        data,
        args.seed,
    )

    if train_data.empty or validation_data.empty or test_data.empty:
        raise ValueError(
            "A data split is empty. Add more distinct scenario_id values "
            "so train, validation, and test each contain scenarios."
        )

    print(f"Rows: train={len(train_data)}, "
          f"validation={len(validation_data)}, test={len(test_data)}")
    print("Split unit: scenario_id")

    thresholds = {}
    report = {
        "input_csv": str(input_path),
        "seed": args.seed,
        "split_method": "GroupShuffleSplit by scenario_id",
        "row_counts": {
            "train": int(len(train_data)),
            "validation": int(len(validation_data)),
            "test": int(len(test_data)),
        },
        "models": {},
    }

    for threat_key, feature_names in THREAT_FEATURES.items():
        label_column = LABEL_COLUMNS[threat_key]
        model_path = output_dir / f"{threat_key}.json"

        y_train = train_data[label_column].astype(int)
        y_validation = validation_data[label_column].astype(int)
        y_test = test_data[label_column].astype(int)

        # XGBoost needs both classes represented in the training data.
        if y_train.nunique() < 2:
            raise ValueError(
                f"{threat_key}: training split must contain positive and "
                "negative examples. Add more labelled scenarios."
            )

        X_train = clean_numeric_features(train_data, feature_names)
        X_validation = clean_numeric_features(validation_data, feature_names)
        X_test = clean_numeric_features(test_data, feature_names)

        model = xgb.XGBClassifier(
            n_estimators=350,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.85,
            colsample_bytree=0.85,
            reg_lambda=1.0,
            objective="binary:logistic",
            eval_metric="logloss",
            tree_method="hist",
            random_state=args.seed,
            n_jobs=-1,
        )

        model.fit(
            X_train,
            y_train,
            eval_set=[(X_validation, y_validation)],
            verbose=False,
        )

        validation_probabilities = model.predict_proba(X_validation)[:, 1]
        threshold, validation_f1 = choose_threshold(
            y_validation.to_numpy(),
            validation_probabilities,
        )

        test_probabilities = model.predict_proba(X_test)[:, 1]
        test_predictions = (test_probabilities >= threshold).astype(int)
        test_f1 = f1_score(
            y_test,
            test_predictions,
            zero_division=0,
        )

        # XGBoost JSON model format can be loaded by the XGBoost C/C++ API.
        model.save_model(model_path)

        thresholds[threat_key] = {
            "threat_class": THREAT_CLASS_NAMES[threat_key],
            "threshold": threshold,
            "features": feature_names,
            "model_file": model_path.name,
        }

        report["models"][threat_key] = {
            "threat_class": THREAT_CLASS_NAMES[threat_key],
            "model_file": model_path.name,
            "feature_count": len(feature_names),
            "validation_f1_at_selected_threshold": validation_f1,
            "test_f1_at_validation_selected_threshold": float(test_f1),
            "test_positive_rows": int(y_test.sum()),
            "test_rows": int(len(y_test)),
        }

        print(
            f"{threat_key}: validation threshold={threshold:.2f}, "
            f"validation F1={validation_f1:.3f}, "
            f"test F1={test_f1:.3f}"
        )

    with (output_dir / "thresholds.json").open("w", encoding="utf-8") as file:
        json.dump(thresholds, file, indent=2)

    with (output_dir / "training_report.json").open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(report, file, indent=2)

    print(f"\nSaved models and reports in: {output_dir.resolve()}")


if __name__ == "__main__":
    main()