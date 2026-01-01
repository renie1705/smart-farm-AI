# path: src/predict.py
"""
Top-level script to load cleaned data, build a timeseries per state (or aggregate across all states),
forecast next N years, and save results.

This corrected version:
 - safer CSV reading with helpful error messages
 - sanitizes filenames (removes/normalizes parentheses, punctuation)
 - clearer handling of "All States (Aggregate)" label and --aggregate/--all flags
 - raises helpful errors when a series is empty or too short to forecast
 - returns non-zero exit when nothing was produced (useful for CI / frontend checks)

Usage:
    python src/predict.py --clean data/processed/cleaned_groundwater.csv --state "Maharashtra" --periods 5 --out data/forecasts
    python src/predict.py --clean data/processed/cleaned_groundwater.csv --aggregate --periods 5 --out data/forecasts
"""
import argparse
import logging
import os
import re
import sys

import matplotlib.pyplot as plt
import pandas as pd

from model import choose_forecast


def ensure_dir(p):
    os.makedirs(p, exist_ok=True)
    return p


def sanitize_name(name: str) -> str:
    """Make a filesystem-safe name from an arbitrary state label."""
    if not name:
        return "All_States_Aggregate"
    # replace common separators with underscore, remove parentheses and other non-word chars
    s = str(name)
    s = s.strip()
    s = re.sub(r"[()/\\]", " ", s)
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^\w_]", "", s)
    # collapse multiple underscores
    s = re.sub(r"_+", "_", s)
    if not s:
        return "All_States_Aggregate"
    return s


def is_all_states_label(label: str) -> bool:
    if not label:
        return False
    low = label.strip().lower()
    return low in ("all states", "all states (aggregate)", "all_states_aggregate", "all_states")


def prepare_series(df: pd.DataFrame, state: str = None, aggregate: bool = False) -> pd.Series:
    """
    Prepare a yearly pd.Series indexed by integer year for the requested state or for the aggregate.

    - df must contain columns: state, year, value
    - for aggregate: sums values across states per year
    - raises ValueError if no data found or series is empty
    """
    if not set(["state", "year", "value"]).issubset(df.columns):
        raise ValueError("Cleaned CSV must contain 'state', 'year', and 'value' columns.")

    df = df.copy()
    df["state"] = df["state"].astype(str).str.strip()
    # aggregate requested explicitly or via the dashboard label
    if aggregate or (state and is_all_states_label(state)):
        grouped = df.groupby("year")["value"].sum().dropna()
        if grouped.empty:
            raise ValueError("No data available to aggregate across states.")
        grouped.index = grouped.index.astype(int)
        return grouped.sort_index()

    if not state:
        raise ValueError("No state provided and aggregate not requested.")

    # exact match first (case-insensitive)
    mask = df["state"].str.lower() == state.strip().lower()
    df_s = df[mask]
    if df_s.empty:
        # try substring match on available states
        candidates = df["state"].astype(str).str.lower().unique()
        matches = [c for c in candidates if state.strip().lower() in c]
        if matches:
            df_s = df[df["state"].astype(str).str.lower() == matches[0]]
        else:
            raise ValueError(f"No data found for state matching '{state}'. Sample available states: {list(candidates)[:20]}")
    grouped = df_s.groupby("year")["value"].mean().dropna()
    if grouped.empty:
        raise ValueError(f"No numeric values found for state '{state}'.")
    grouped.index = grouped.index.astype(int)
    return grouped.sort_index()


def plot_forecast(history: pd.Series, forecast: pd.Series, state_label: str, method: str, out_path: str):
    plt.figure(figsize=(8, 5))
    plt.plot(history.index, history.values, marker="o", label="history")
    plt.plot(forecast.index, forecast.values, marker="o", linestyle="--", label=f"forecast ({method})")
    plt.title(f"Groundwater metric for {state_label} — forecast")
    plt.xlabel("Year")
    plt.ylabel("Value (dataset units)")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()


def forecast_state(df: pd.DataFrame, state_label: str, periods: int, out_dir: str, aggregate: bool = False):
    series = prepare_series(df, state=state_label, aggregate=aggregate)
    if series.empty:
        raise ValueError(f"No series data available for '{state_label}' to forecast.")
    # choose_forecast may raise if series too short
    forecast_ser, method = choose_forecast(series, periods=periods)
    ensure_dir(out_dir)
    cleaned_state_name = sanitize_name(state_label if not aggregate else "All_States_Aggregate")
    fname_csv = os.path.join(out_dir, f"{cleaned_state_name}_forecast.csv")
    hist_df = pd.DataFrame({"year": list(series.index), "value": list(series.values), "type": ["history"] * len(series)})
    f_df = pd.DataFrame({"year": list(forecast_ser.index), "value": list(forecast_ser.values), "type": ["forecast"] * len(forecast_ser)})
    result_df = pd.concat([hist_df, f_df], ignore_index=True)
    result_df.to_csv(fname_csv, index=False)
    logging.info("Saved forecast CSV: %s", fname_csv)
    plot_path = os.path.join(out_dir, f"{cleaned_state_name}_forecast.png")
    plot_forecast(series, forecast_ser, state_label if not aggregate else "All States (Aggregate)", method, plot_path)
    logging.info("Saved plot: %s", plot_path)
    return fname_csv, plot_path


def main(args):
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
    try:
        df = pd.read_csv(args.clean)
    except FileNotFoundError:
        logging.error("Cleaned CSV not found: %s", args.clean)
        sys.exit(2)
    except Exception as e:
        logging.error("Failed to read cleaned CSV: %s (%s)", args.clean, e)
        sys.exit(3)

    ensure_dir(args.out)
    results = []

    # Determine whether to do aggregate/All states
    if args.aggregate or args.all:
        try:
            csv_p, plot_p = forecast_state(df, "All States (Aggregate)", args.periods, args.out, aggregate=True)
            results.append({"state": "All States (Aggregate)", "csv": csv_p, "plot": plot_p})
        except Exception as e:
            logging.error("Aggregate forecast failed: %s", e)
    else:
        try:
            csv_p, plot_p = forecast_state(df, args.state, args.periods, args.out, aggregate=False)
            results.append({"state": args.state, "csv": csv_p, "plot": plot_p})
        except Exception as e:
            logging.error("Forecast failed for state %s: %s", args.state, e)

    logging.info("Completed forecasts for %d items.", len(results))
    if not results:
        logging.error("No forecasts were generated. See logs for details.")
        sys.exit(4)

    for r in results:
        print(r)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Forecast groundwater metric for a state or aggregate across all states.")
    parser.add_argument("--clean", default="data/processed/cleaned_groundwater.csv", help="Cleaned CSV created by process_data.py")
    parser.add_argument("--state", default="Maharashtra", help="State name to forecast. Use --aggregate or --all to forecast across all states.")
    parser.add_argument("--periods", type=int, default=5, help="Number of future years to forecast.")
    parser.add_argument("--out", default="data/forecasts", help="Output folder for forecasts and plots.")
    parser.add_argument("--aggregate", action="store_true", help="Aggregate across all states and forecast the total (sum) time series.")
    parser.add_argument("--all", action="store_true", help="Alias for --aggregate (keeps old interface).")
    args = parser.parse_args()
    main(args)