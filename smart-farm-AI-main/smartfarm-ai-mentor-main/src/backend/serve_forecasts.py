# path: backend/serve_forecasts.py
"""
Small Flask server to serve forecast CSV files as JSON and static files.

Fixes and improvements applied:
 - Robust CSV reading: normalize column names (lower-case stripped) so 'Year'/'year' both work.
 - Validates existence of expected columns and coerces year/value to numeric.
 - Drops invalid rows before building the response.
 - Safer conversions to int/float with error handling.
 - Returns clear error messages and HTTP status codes.
 - Adds a simple health endpoint at /health.
 - Uses a lowercase `app` variable (conventional).
 - Ensures the forecast directory is created when running as __main__.
"""
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import os
import pandas as pd
import logging
from typing import Dict, Any

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# path where predict.py writes forecasts
FORECAST_DIR = os.path.abspath(os.path.join(os.getcwd(), "data", "forecasts"))


def cleaned_filename_for_state(state: str) -> str:
    """
    Create a sanitized forecast filename for a given state label.
    """
    if not state:
        return "All_States_Aggregate_forecast.csv"
    cleaned = str(state).strip()
    cleaned = cleaned.replace("/", "_").replace(" ", "_")
    # remove characters other than letters, numbers, underscore and dash
    cleaned = "".join(ch for ch in cleaned if (ch.isalnum() or ch in ("_", "-")))
    if not cleaned:
        return "All_States_Aggregate_forecast.csv"
    return f"{cleaned}_forecast.csv"


@app.route("/health")
def health():
    return jsonify({"status": "ok", "forecast_dir": FORECAST_DIR})


@app.route("/api/forecast")
def api_forecast():
    """
    Return JSON { state, history: [{year, value, type}], forecast: [...] } for the requested state.
    Query param: ?state=STATE_NAME
    If state is "All States (Aggregate)" (case-insensitive) or similar, the aggregate filename is used.
    """
    state = request.args.get("state", "All States (Aggregate)")
    logging.info("api_forecast requested for state: %s", state)

    # treat All States label as aggregate
    if state and str(state).strip().lower() in ("all states", "all states (aggregate)", "all_states_aggregate", "all_states"):
        fname = "All_States_Aggregate_forecast.csv"
    else:
        fname = cleaned_filename_for_state(state)

    file_path = os.path.join(FORECAST_DIR, fname)
    if not os.path.isfile(file_path):
        logging.warning("Forecast file not found: %s", file_path)
        return jsonify({"error": "forecast file not found", "requested_file": fname}), 404

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        logging.exception("Failed to read forecast file %s: %s", file_path, e)
        return jsonify({"error": "failed to read forecast file", "message": str(e)}), 500

    # Normalize columns to lowercase/stripped names
    df.columns = [str(c).strip().lower() for c in df.columns]

    # Expected columns: year, value, type (type optional)
    if "year" not in df.columns or "value" not in df.columns:
        logging.error("Forecast file missing required columns 'year' and/or 'value': %s", file_path)
        return jsonify({"error": "forecast file missing required columns 'year' and/or 'value'"}), 500

    # Coerce to numeric and drop invalid rows
    df["year"] = pd.to_numeric(df["year"], errors="coerce")
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    if "type" not in df.columns:
        df["type"] = ""

    df = df.dropna(subset=["year", "value"]).copy()
    if df.empty:
        logging.warning("Forecast file contains no valid numeric rows after coercion: %s", file_path)
        return jsonify({"error": "forecast file contains no valid numeric rows"}), 500

    # Sort by year for predictable output
    df = df.sort_values("year")

    resp: Dict[str, Any] = {"state": state, "history": [], "forecast": []}
    for _, row in df.iterrows():
        try:
            year = int(row["year"])
        except Exception:
            # skip rows that can't be converted to integer year
            logging.debug("Skipping row with invalid year: %s", row.get("year"))
            continue
        try:
            value = float(row["value"])
        except Exception:
            logging.debug("Skipping row with invalid value for year %s: %s", year, row.get("value"))
            continue
        typ = str(row.get("type", "")).strip()
        rec = {"year": year, "value": value, "type": typ}
        if typ.lower() == "forecast":
            resp["forecast"].append(rec)
        else:
            resp["history"].append(rec)

    return jsonify(resp)


@app.route("/static/forecasts/<path:filename>")
def static_forecast_file(filename):
    # convenience route to fetch raw CSV/PNG: e.g. /static/forecasts/All_States_Aggregate_forecast.csv
    if not os.path.isdir(FORECAST_DIR):
        logging.error("Forecast directory does not exist: %s", FORECAST_DIR)
        return abort(404)
    return send_from_directory(FORECAST_DIR, filename, as_attachment=False)


if __name__ == "__main__":
    os.makedirs(FORECAST_DIR, exist_ok=True)
    logging.info("Serving forecasts directory: %s", FORECAST_DIR)
    # debug=True is useful for development only
    app.run(host="0.0.0.0", port=5000, debug=True)