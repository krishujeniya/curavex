"""Cookiecutter standard make_dataset script: transforms raw dataset to processed dataset."""
from pathlib import Path
import pandas as pd

from src.config import DATA_PATH, DATA_PROCESSED_PATH
from src.data.validator import validate_schema, clean_dataframe, generate_data_health_report


def process_dataset(raw_path: Path = DATA_PATH, output_path: Path = DATA_PROCESSED_PATH) -> pd.DataFrame:
    """Ingest raw clinical trial cohort, validate, sanitize, and write to processed storage."""
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw clinical dataset not found at {raw_path}")

    df_raw = pd.read_csv(raw_path)
    is_valid, errors = validate_schema(df_raw, require_target=True)
    if not is_valid:
        raise ValueError(f"Raw dataset validation failed: {errors}")

    df_clean = clean_dataframe(df_raw)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df_clean.to_csv(output_path, index=False)

    report = generate_data_health_report(df_clean)
    print(f"Processed {report['total_records']} records successfully to {output_path}")
    return df_clean


if __name__ == "__main__":
    process_dataset()
