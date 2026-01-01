# path: src/debug_check.py
"""
Small diagnostic helper to inspect the cleaned CSV quickly.

Usage:
    python src/debug_check.py --clean data/processed/cleaned_groundwater.csv

This prints:
 - number of rows
 - number of unique states (if 'state' column present)
 - min/max year (if 'year' column present and numeric)
 - first 20 rows
 - checks if "All States (Aggregate)" exists (case-insensitive) in the state column
 - saves a short diagnostics file data/processed/debug_summary.txt
"""
import argparse
import json
import os
import sys

import pandas as pd


def main(args):
    try:
        df = pd.read_csv(args.clean)
    except FileNotFoundError:
        print(f"Error: cleaned CSV not found at: {args.clean}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"Error: failed to read CSV ({e})", file=sys.stderr)
        sys.exit(3)

    summary = {"rows": int(len(df))}

    # states info
    if "state" in df.columns:
        try:
            states_unique = df["state"].astype(str).str.strip().replace("", "Unknown")
            summary["states_count"] = int(states_unique.nunique())
            # provide a sample list (up to 50)
            sample_states = list(states_unique.unique()[:50])
            summary["sample_states"] = sample_states
            # check for "All States" label presence (case-insensitive)
            summary["contains_all_states_label"] = bool(
                states_unique.str.lower().str.contains("all states").any()
            )
        except Exception:
            summary["states_count"] = 0
            summary["sample_states"] = []
            summary["contains_all_states_label"] = False
    else:
        summary["states_count"] = 0
        summary["sample_states"] = []
        summary["contains_all_states_label"] = False

    # year info
    if "year" in df.columns:
        try:
            # coerce to numeric and drop na for min/max
            years = pd.to_numeric(df["year"], errors="coerce").dropna().astype(int)
            if not years.empty:
                summary["year_min"] = int(years.min())
                summary["year_max"] = int(years.max())
            else:
                summary["year_min"] = None
                summary["year_max"] = None
        except Exception:
            summary["year_min"] = None
            summary["year_max"] = None
    else:
        summary["year_min"] = None
        summary["year_max"] = None

    print("Summary:")
    print(json.dumps(summary, indent=2))

    print("\nFirst 20 rows (if available):")
    if df.empty:
        print("<empty dataframe>")
    else:
        # pretty print head safely
        try:
            print(df.head(20).to_string(index=False))
        except Exception:
            # fallback if weird types prevent to_string
            print(df.head(20).to_dict(orient="records"))

    # ensure output directory exists
    out_dir = os.path.dirname(args.clean) or "."
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "debug_summary.txt")
    try:
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(summary, fh, indent=2)
        print("\nSaved debug summary to:", out_path)
    except Exception as e:
        print(f"Warning: failed to write debug summary ({e})", file=sys.stderr)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--clean", default="data/processed/cleaned_groundwater.csv", help="Path to cleaned CSV")
    args = parser.parse_args()
    main(args)