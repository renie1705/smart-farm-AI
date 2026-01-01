# path: src/ingest_csv.py
"""
Ingest the provided groundwater snapshot CSV into a lightweight SQLite database.

Usage:
  python src/ingest_csv.py --input data/raw/ea156058-114e-48d4-b70a-7f266536d94f.csv --db data/groundwater.db

What it does:
 - Reads the CSV provided by you
 - Detects the state/name column and the main metric columns by keyword matching
 - Normalizes them to columns: state, availability, extraction, stage
 - Writes a 'states' table into the given SQLite DB (replaces if exists)
 - Also writes a 'raw_snapshot' table with the original CSV (for debugging)
"""
import argparse
import os
import re
import sqlite3
import sys

import pandas as pd


def find_column(columns, patterns):
    cols_lower = {c: c.lower() for c in columns}
    for patt in patterns:
        p_low = patt.lower()
        for orig, low in cols_lower.items():
            if p_low in low:
                return orig
        try:
            regex = re.compile(patt, flags=re.I)
            for orig in columns:
                if regex.search(orig):
                    return orig
        except re.error:
            pass
    return None


def build_normalized_df(df: pd.DataFrame) -> pd.DataFrame:
    cols = list(df.columns)

    state_col = find_column(cols, ["name of state/ut", "name of state", "state/ut", "state", "name"])
    if state_col is None:
        # fallback to first non-numeric column
        for c in cols:
            if not pd.api.types.is_numeric_dtype(df[c]):
                state_col = c
                break
    if state_col is None:
        raise ValueError("Could not determine state column in CSV.")

    availability_col = find_column(cols, [
        "total annual groundwater recharge",
        "total annual groundwater recharge (bcm)",
        "total annual groundwater recharge,",
        "total annual groundwater recharge"
    ])

    extraction_col = find_column(cols, [
        "total annual extraction",
        "total annual extraction (bcm)",
        "total annual extraction,",
        "total annual extraction"
    ])

    stage_col = find_column(cols, [
        "stage of gw extraction",
        "stage of gw extraction (%)",
        "stage of extraction",
        "stage of gw extraction %"
    ])

    norm = pd.DataFrame()
    norm["state"] = df[state_col].astype(str).str.strip()

    def to_numeric_if_exists(colname):
        if colname and colname in df.columns:
            return pd.to_numeric(df[colname], errors="coerce")
        return pd.Series([float("nan")] * len(df))

    norm["availability"] = to_numeric_if_exists(availability_col)
    norm["extraction"] = to_numeric_if_exists(extraction_col)
    norm["stage"] = to_numeric_if_exists(stage_col)

    # keep additional columns available in DB as 'raw_*' prefixed columns
    for c in cols:
        if c not in (state_col, availability_col, extraction_col, stage_col):
            safe_name = re.sub(r"[^\w]", "_", c).lower()
            norm[f"raw_{safe_name}"] = df[c]

    return norm


def ingest(input_csv: str, db_path: str):
    if not os.path.isfile(input_csv):
        print(f"Input CSV not found: {input_csv}", file=sys.stderr)
        sys.exit(2)

    df = pd.read_csv(input_csv)
    norm = build_normalized_df(df)

    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        norm.to_sql("states", conn, if_exists="replace", index=False)
        df.to_sql("raw_snapshot", conn, if_exists="replace", index=False)
        print(f"Wrote {len(norm)} rows to {db_path} (table 'states').")
    finally:
        conn.close()


def main():
    p = argparse.ArgumentParser(description="Ingest groundwater snapshot CSV into SQLite DB")
    p.add_argument("--input", required=True, help="Path to the snapshot CSV")
    p.add_argument("--db", default="data/groundwater.db", help="Path to SQLite DB to write")
    args = p.parse_args()
    ingest(args.input, args.db)


if __name__ == "__main__":
    main()