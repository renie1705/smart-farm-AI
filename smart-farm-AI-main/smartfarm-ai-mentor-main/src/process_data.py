# path: src/process_data.py
"""
Process raw dataset files into a cleaned, long-format CSV suitable for modelling.

This corrected version:
 - fixes bugs around year-column detection (now accepts any iterable of column names)
 - consistently works on standardized column names to avoid mismatches
 - more robustly finds a state column and a numeric value column
 - safer handling of cases where a valid (state, year, value) triple cannot be determined

Usage:
    python src/process_data.py --raw_dir data/raw --out data/processed/cleaned_groundwater.csv --debug
"""
import argparse
import glob
import json
import os
import re
from typing import Iterable, Optional

import numpy as np
import pandas as pd


def read_first_table(path) -> Optional[pd.DataFrame]:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".csv":
        return pd.read_csv(path, low_memory=False)
    elif ext in (".xls", ".xlsx"):
        xls = pd.ExcelFile(path)
        for sheet in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet)
            if not df.empty:
                return df
    else:
        # try CSV as fallback
        try:
            return pd.read_csv(path, low_memory=False)
        except Exception:
            return None


def detect_year_columns(cols: Iterable) -> list:
    """
    Given an iterable of column names, return those that look like year columns
    (e.g., "2001", "2001-02", "2001/02").
    """
    year_cols = []
    for c in cols:
        s = str(c)
        if re.match(r"^\s*\d{4}\s*$", s):
            year_cols.append(c)
        elif re.match(r"^\s*\d{4}[-/]\d{2}\s*$", s):
            year_cols.append(c)
    return year_cols


def standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns=lambda c: re.sub(r"[^\w\s]", "_", str(c)).strip().lower())
    return df


def melt_wide_to_long(df: pd.DataFrame, year_cols, id_vars):
    # melt years columns into 'year' and 'value'
    df_long = df.melt(id_vars=id_vars, value_vars=year_cols, var_name="year", value_name="value")
    # extract first 4-digit year
    df_long["year"] = df_long["year"].astype(str).str.extract(r"(\d{4})")
    df_long = df_long[df_long["year"].notna()].copy()
    df_long["year"] = df_long["year"].astype(int)
    return df_long


def try_make_long(df: pd.DataFrame) -> pd.DataFrame:
    """
    Try to produce a DataFrame with columns: state, year, value
    using heuristics for wide or long formats. Works on standardized column names.
    """
    df0 = df.copy()
    df0 = standardize_columns(df0)

    # If already long with a 'year' column and a numeric-like column
    if "year" in df0.columns:
        # prefer 'value' column, else try 'availability' or 'extraction', else any numeric column
        if "value" not in df0.columns:
            preferred = [c for c in ("availability", "extraction", "amount", "quantity") if c in df0.columns]
            if preferred:
                df0 = df0.rename(columns={preferred[0]: "value"})
            else:
                numeric_cols = [c for c in df0.columns if pd.api.types.is_numeric_dtype(df0[c])]
                numeric_cols = [c for c in numeric_cols if c != "year"]
                if numeric_cols:
                    df0 = df0.rename(columns={numeric_cols[0]: "value"})
        # try to ensure there is a state column
        if "state" not in df0.columns:
            for c in df0.columns:
                if re.search(r"state|region|area|name|unit", c, re.I):
                    df0 = df0.rename(columns={c: "state"})
                    break
        if set(["state", "year", "value"]).issubset(df0.columns):
            return df0[["state", "year", "value"]]

    # Detect wide year columns (use original standardized column names)
    year_cols = detect_year_columns(df0.columns)
    if year_cols:
        id_vars = [c for c in df0.columns if c not in year_cols]
        # if no id_vars, melt will fail — ensure at least an index column
        if not id_vars:
            df0 = df0.reset_index().rename(columns={"index": "index"})
            id_vars = ["index"]
        long = melt_wide_to_long(df0, year_cols, id_vars=id_vars)
        # find state column among id_vars / long columns
        state_col = None
        for c in id_vars:
            if re.search(r"state|region|area|name|unit", str(c), re.I):
                state_col = c
                break
        if state_col is None:
            # fallback: pick the first id_var
            state_col = id_vars[0]
        if state_col:
            long = long.rename(columns={state_col: "state"})
        else:
            long["state"] = "unknown"
        # ensure value column exists (already 'value' by melt)
        if "value" not in long.columns:
            remaining = [c for c in long.columns if c not in ("state", "year")]
            for c in remaining:
                if pd.api.types.is_numeric_dtype(long[c]):
                    long = long.rename(columns={c: "value"})
                    break
        # final safety: ensure expected columns exist
        if set(["state", "year", "value"]).issubset(long.columns):
            return long[["state", "year", "value"]]
        else:
            # try to coerce found columns into required shape
            long_cols = long.columns.tolist()
            if "year" in long_cols:
                # attempt to find a numeric column for value
                numeric_cols = [c for c in long_cols if pd.api.types.is_numeric_dtype(long[c]) and c != "year"]
                if numeric_cols:
                    long = long.rename(columns={numeric_cols[0]: "value"})
                    if "state" not in long.columns:
                        long["state"] = "unknown"
                    return long[["state", "year", "value"]]

    # Fallback heuristics: try to find a year column candidate and numeric candidate
    cols = df0.columns.tolist()
    year_cand = None
    for c in cols:
        if re.search(r"\byear\b|\byr\b", c, re.I) or re.match(r"^\d{4}$", str(c)):
            year_cand = c
            break
    value_cand = None
    for c in cols:
        if pd.api.types.is_numeric_dtype(df0[c]):
            value_cand = c
            if c != year_cand:
                break
    if year_cand and value_cand:
        df_try = df0.rename(columns={year_cand: "year", value_cand: "value"})
        # find state col
        state_col = None
        for c in cols:
            if re.search(r"state|region|area|name", c, re.I):
                state_col = c
                break
        if state_col:
            df_try = df_try.rename(columns={state_col: "state"})
        else:
            df_try["state"] = "unknown"
        # ensure types
        df_try["year"] = pd.to_numeric(df_try["year"], errors="coerce")
        df_try["value"] = pd.to_numeric(df_try["value"], errors="coerce")
        df_try = df_try[df_try["year"].notna() & df_try["value"].notna()]
        if not df_try.empty:
            df_try["year"] = df_try["year"].astype(int)
            return df_try[["state", "year", "value"]]

    # give up: return original standardized DF (caller will decide what to do)
    return df0


def normalize_state(s):
    if pd.isna(s):
        return "Unknown"
    s = str(s).strip()
    s = re.sub(r"\s+", " ", s)
    # preserve existing capitalization heuristics but don't fully force Title case for acronyms
    return s.title()


def process_all(raw_dir, out_csv, debug=False):
    files = glob.glob(os.path.join(raw_dir, "*"))
    if not files:
        raise RuntimeError(f"No files found in {raw_dir}. Please run fetch_data.py first.")
    processed_parts = []
    for f in files:
        try:
            df = read_first_table(f)
            if df is None or df.empty:
                print("Skipping unreadable/empty file:", f)
                continue
            long = try_make_long(df)
            # Ensure we have the expected columns; attempt to coerce otherwise
            if "state" not in long.columns:
                long["state"] = "Unknown"
            if "year" not in long.columns:
                # cannot proceed without a year column
                print(f"No 'year' column detected in {f} — skipping")
                continue
            # Normalize state names
            long["state"] = long["state"].apply(normalize_state)
            # Coerce year to numeric
            long["year"] = pd.to_numeric(long["year"], errors="coerce")
            # Keep only year, state, value
            if "value" in long.columns:
                long["value"] = pd.to_numeric(long["value"], errors="coerce")
            else:
                numeric_cols = [c for c in long.columns if pd.api.types.is_numeric_dtype(long[c])]
                if numeric_cols:
                    long = long.rename(columns={numeric_cols[0]: "value"})
                    long["value"] = pd.to_numeric(long["value"], errors="coerce")
                else:
                    print("No numeric column found in:", f, " — skipping")
                    continue
            long["source_file"] = os.path.basename(f)
            # drop rows missing year/value
            long = long[long["year"].notna() & long["value"].notna()].copy()
            if long.empty:
                print("No valid rows in after cleaning for:", f, " — skipping")
                continue
            # ensure year is int
            long["year"] = long["year"].astype(int)
            processed_parts.append(long[["state", "year", "value", "source_file"]])
            print("Processed:", f)
        except Exception as e:
            print("Failed to process", f, ":", e)
    if not processed_parts:
        raise RuntimeError("No usable data found after processing files.")
    combined = pd.concat(processed_parts, ignore_index=True, sort=False)
    # final cleanup and sort
    combined = combined[combined["year"].notna() & combined["value"].notna()].copy()
    combined["year"] = combined["year"].astype(int)
    combined = combined.sort_values(["state", "year"]).reset_index(drop=True)
    os.makedirs(os.path.dirname(out_csv) or ".", exist_ok=True)
    combined.to_csv(out_csv, index=False)
    # diagnostics
    diagnostics = {
        "rows": int(len(combined)),
        "states": int(combined["state"].nunique()),
        "years_min": int(combined["year"].min()),
        "years_max": int(combined["year"].max()),
        "sample_states": combined["state"].unique()[:10].tolist()
    }
    diag_path = os.path.join(os.path.dirname(out_csv), "diagnostics.txt")
    with open(diag_path, "w", encoding="utf-8") as fh:
        json.dump(diagnostics, fh, indent=2)
    if debug:
        print("Diagnostics:", diagnostics)
        print("Head of combined dataset:")
        print(combined.head(20).to_string(index=False))
    print("Saved cleaned data to:", out_csv)
    print("Saved diagnostics to:", diag_path)
    return out_csv


def main(args):
    out = process_all(args.raw_dir, args.out, debug=args.debug)
    print("Done.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process raw groundwater dataset files to cleaned long CSV.")
    parser.add_argument("--raw_dir", default="data/raw", help="Directory containing raw downloaded files.")
    parser.add_argument("--out", default="data/processed/cleaned_groundwater.csv", help="Output cleaned CSV path.")
    parser.add_argument("--debug", action="store_true", help="Print debugging info and dataset sample.")
    args = parser.parse_args()
    main(args)