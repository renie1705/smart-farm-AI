# path: src/forecast_from_snapshot.py
"""
Create simple 5-year forecasts from a single-year groundwater snapshot CSV.

Why this script:
- The CSV you provided is a single snapshot (one row per state) without a time series.
  Time-series models (ARIMA, SARIMA, etc.) require historical yearly data per state.
- This script creates scenario-based forecasts from that snapshot using simple
  deterministic assumptions (compound or linear growth rates). Use it when
  historical yearly data is not available.

What it does:
- Loads the snapshot CSV (file name provided).
- Lets you pick one metric/column to forecast (e.g., "Total Annual Extraction" or "Stage of GW extraction (%)").
- For each state it builds a "history" consisting of a single known year (you choose the base year).
- Produces N-year forecasts using:
    * compound growth: v_t+1 = v_t * (1 + rate)
    * or linear growth:  v_t+1 = v_t + delta
- Saves:
    - data/forecasts/<metric>_per_state_forecasts.csv  (history + forecast rows for all states)
    - data/forecasts/<metric>_aggregate_forecast.csv   (aggregate sum/mean history + forecasts)
    - PNG plot per-state in data/forecasts/plots/<State>_<metric>_forecast.png
- Prints available metrics if you don't specify one.

Usage examples:
  pip install pandas matplotlib
  python src/forecast_from_snapshot.py --input ea156058-114e-48d4-b70a-7f266536d94f.csv \
      --metric "Total Annual Extraction" --base-year 2024 --periods 5 --rate -0.01 --mode compound

  # Or forecast extraction stage (percentage) with a +0.5% absolute increase per year (linear)
  python src/forecast_from_snapshot.py --input ea156058-114e-48d4-b70a-7f266536d94f.csv \
      --metric "Stage of GW extraction (%)" --base-year 2024 --periods 5 --delta 0.5 --mode linear

Notes:
- Choose mode=compound with --rate (e.g., -0.01 for -1% per year) OR mode=linear with --delta (absolute change per year).
- This is a scenario-based projection rather than a statistical forecast. If you can provide historical yearly files,
  I can adapt the pipeline to build real time-series models.
"""
import argparse
import os
import re
from typing import List

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def sanitize_filename(s: str) -> str:
    s = str(s).strip()
    s = re.sub(r"[()/\\]", " ", s)
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^\w\-_\.]", "", s)
    return s or "metric"


def read_snapshot(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    return df


def list_metrics(df: pd.DataFrame) -> List[str]:
    # Exclude obvious ID columns
    exclude = {"_id", "sl. no", "sl no", "slno", "sl", "id", "name of state/ut", "name of state", "name"}
    cols = [c for c in df.columns if c not in exclude]
    return cols


def build_forecasts_for_value(value: float, periods: int, mode: str, rate: float = 0.0, delta: float = 0.0):
    hist = [value]
    years = [0]
    if mode == "compound":
        v = value
        for i in range(1, periods + 1):
            v = v * (1.0 + rate)
            hist.append(v)
            years.append(i)
    else:  # linear
        v = value
        for i in range(1, periods + 1):
            v = v + delta
            hist.append(v)
            years.append(i)
    return years, hist


def ensure_dirs(base: str):
    os.makedirs(base, exist_ok=True)
    os.makedirs(os.path.join(base, "plots"), exist_ok=True)


def run(args):
    df = read_snapshot(args.input)
    # Normalize column names to original labels (we will show choices)
    available = list_metrics(df)
    if not args.metric:
        print("Available metric columns (choose one with --metric):")
        for c in available:
            print(" -", c)
        raise SystemExit(0)

    metric = args.metric
    if metric not in df.columns:
        # try case-insensitive match
        matches = [c for c in df.columns if c.lower() == metric.lower()]
        if matches:
            metric = matches[0]
        else:
            close = [c for c in df.columns if metric.lower() in c.lower()]
            print(f"Metric '{args.metric}' not found. Closest matches:")
            for c in close:
                print(" -", c)
            raise SystemExit(1)

    # Determine state name column (try several common names)
    state_col_candidates = [c for c in df.columns if re.search(r"state|region|name", c, re.I)]
    if not state_col_candidates:
        raise SystemExit("Could not find a state/name column in the CSV.")
    state_col = state_col_candidates[0]

    # Ensure numeric metric values
    values = pd.to_numeric(df[metric], errors="coerce")
    if values.isna().all():
        raise SystemExit(f"Metric '{metric}' contains no numeric values.")

    base_year = int(args.base_year)
    periods = int(args.periods)
    mode = args.mode
    rate = float(args.rate) if args.rate is not None else 0.0
    delta = float(args.delta) if args.delta is not None else 0.0

    out_dir = args.out or "data/forecasts"
    ensure_dirs(out_dir)
    plots_dir = os.path.join(out_dir, "plots")

    rows = []
    # For each state create history and forecasts (we treat the single known year as history)
    for idx, row in df.iterrows():
        state = str(row[state_col]).strip()
        try:
            val = float(row[metric])
        except Exception:
            # skip non-numeric
            continue
        # Build forecast values for periods years ahead
        years_offset, series_vals = build_forecasts_for_value(val, periods, mode, rate, delta)
        # Convert offsets to actual years
        years = [int(base_year + y) for y in years_offset]
        # First element is history (base year)
        for i, y in enumerate(years):
            ttype = "history" if i == 0 else "forecast"
            rows.append({"state": state, "year": int(y), "value": float(series_vals[i]), "type": ttype})

        # Save per-state plot
        hist_years = years
        hist_vals = series_vals
        plt.figure(figsize=(7, 4))
        plt.plot(hist_years, hist_vals, marker="o", linestyle=("-" if len(hist_years) > 1 else "-"))
        plt.title(f"{state} — {metric} projection")
        plt.xlabel("Year")
        plt.ylabel(metric)
        plt.grid(True)
        plt.tight_layout()
        fname = os.path.join(plots_dir, f"{sanitize_filename(state)}_{sanitize_filename(metric)}_forecast.png")
        plt.savefig(fname)
        plt.close()

    # Create combined DataFrame
    out_df = pd.DataFrame(rows)
    # Save per-metric combined file (history + forecasts for all states)
    metric_fname = f"{sanitize_filename(metric)}_per_state_forecasts.csv"
    metric_path = os.path.join(out_dir, metric_fname)
    out_df.to_csv(metric_path, index=False)
    print("Saved per-state forecasts to:", metric_path)

    # Also produce an aggregate series (sum across states per year)
    agg = out_df.groupby("year")["value"].sum().reset_index().sort_values("year")
    agg_fname = f"{sanitize_filename(metric)}_aggregate_forecast.csv"
    agg_path = os.path.join(out_dir, agg_fname)
    agg.to_csv(agg_path, index=False)
    print("Saved aggregate forecast to:", agg_path)

    # Optionally, save a JSON summary for API consumption
    try:
        json_path = os.path.join(out_dir, f"{sanitize_filename(metric)}_summary.json")
        # build history+forecast arrays for aggregate
        history = []
        forecast = []
        # We consider base_year entry as history
        for _, r in agg.iterrows():
            if int(r["year"]) <= base_year:
                history.append({"year": int(r["year"]), "value": float(r["value"])})
            else:
                forecast.append({"year": int(r["year"]), "value": float(r["value"])})
        import json
        with open(json_path, "w", encoding="utf-8") as fh:
            json.dump({"metric": metric, "history": history, "forecast": forecast}, fh, indent=2)
        print("Saved aggregate JSON summary to:", json_path)
    except Exception:
        pass

    print("Plots for each state saved in:", plots_dir)
    print("Done.")


def build_argparser():
    p = argparse.ArgumentParser(description="Scenario-based forecasts from a single-year groundwater snapshot CSV.")
    p.add_argument("--input", required=True, help="Path to snapshot CSV (e.g., ea156058-114e-48d4-b70a-7f266536d94f.csv)")
    p.add_argument("--metric", required=False, help="Column name to forecast (e.g., 'Total Annual Extraction' or 'Stage of GW extraction (%)'). If omitted the script prints available metrics.")
    p.add_argument("--base-year", default=2024, help="Year of the snapshot (int). Default: 2024")
    p.add_argument("--periods", type=int, default=5, help="Number of years to forecast ahead. Default: 5")
    p.add_argument("--mode", choices=("compound", "linear"), default="compound", help="Compound percent growth or linear absolute delta per year")
    p.add_argument("--rate", type=float, default=0.0, help="Annual compound growth rate (e.g., 0.01 for +1%%, -0.01 for -1%%). Used when mode=compound.")
    p.add_argument("--delta", type=float, default=0.0, help="Annual absolute change (same units as metric). Used when mode=linear.")
    p.add_argument("--out", default="data/forecasts", help="Output directory for forecasts and plots.")
    return p


if __name__ == "__main__":
    parser = build_argparser()
    args = parser.parse_args()
    run(args)