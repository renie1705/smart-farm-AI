# path: src/api_server.py
"""
Flask API server that reads from the SQLite DB created by src/ingest_csv.py
and serves endpoints your dashboard can call.

Endpoints:
 - GET /health
 - GET /api/states         -> summary + per-state metrics
 - GET /api/table          -> full per-state table JSON
 - GET /api/top10?metric=availability|extraction|stage
 - GET /api/forecast?state=...&metric=availability|extraction|stage&periods=5&base_year=2024&mode=compound&rate=-0.01

Usage:
  1) Ingest CSV into DB (once or when CSV updates):
     python src/ingest_csv.py --input data/raw/ea156058-114e-48d4-b70a-7f266536d94f.csv --db data/groundwater.db

  2) Run server:
     pip install flask flask-cors pandas
     python src/api_server.py
"""
import os
import math
import logging
import sqlite3
from typing import Dict, Any

import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

DB_PATH = os.environ.get("GROUNDWATER_DB", os.path.join(os.getcwd(), "data", "groundwater.db"))


def read_states_from_db(db_path: str) -> pd.DataFrame:
    if not os.path.isfile(db_path):
        raise FileNotFoundError(f"Database not found at: {db_path}")
    conn = sqlite3.connect(db_path)
    try:
        df = pd.read_sql_query("SELECT * FROM states", conn)
        return df
    finally:
        conn.close()


def scenario_forecast_single_value(value: float, periods: int, mode: str, rate: float = 0.0, delta: float = 0.0):
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return []
    series = []
    v = float(value)
    series.append((0, v))
    for i in range(1, periods + 1):
        if mode == "compound":
            v = v * (1.0 + rate)
        else:
            v = v + delta
        series.append((i, v))
    return series


@app.route("/health")
def health():
    ok = os.path.isfile(DB_PATH)
    return jsonify({"status": "ok" if ok else "missing_db", "db_path": DB_PATH})


@app.route("/api/table")
def api_table():
    try:
        df = read_states_from_db(DB_PATH)
    except Exception as e:
        logging.exception("Failed to read DB")
        return jsonify({"error": str(e)}), 500

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "state": r.get("state"),
            "availability": None if pd.isna(r.get("availability")) else float(r.get("availability")),
            "extraction": None if pd.isna(r.get("extraction")) else float(r.get("extraction")),
            "stage": None if pd.isna(r.get("stage")) else float(r.get("stage"))
        })
    return jsonify({"rows": rows})


@app.route("/api/states")
def api_states():
    try:
        df = read_states_from_db(DB_PATH)
    except Exception as e:
        logging.exception("Failed to read DB")
        return jsonify({"error": str(e)}), 500

    total_availability = float(df["availability"].sum(skipna=True)) if not df["availability"].dropna().empty else None
    total_extraction = float(df["extraction"].sum(skipna=True)) if not df["extraction"].dropna().empty else None
    extraction_stage_avg = None if df["stage"].dropna().empty else float(df["stage"].mean())
    crit_count = int((df["stage"] > 90).sum()) if "stage" in df.columns else 0

    states = []
    for _, r in df.iterrows():
        states.append({
            "state": r.get("state"),
            "availability": None if pd.isna(r.get("availability")) else float(r.get("availability")),
            "extraction": None if pd.isna(r.get("extraction")) else float(r.get("extraction")),
            "stage": None if pd.isna(r.get("stage")) else float(r.get("stage")),
            "status": "critical" if (not pd.isna(r.get("stage")) and r.get("stage") > 90) else "ok"
        })

    return jsonify({
        "total_availability": total_availability,
        "total_extraction": total_extraction,
        "extraction_stage_avg": extraction_stage_avg,
        "critical_states_count": crit_count,
        "states": states
    })


@app.route("/api/top10")
def api_top10():
    metric = request.args.get("metric", "availability").strip().lower()
    if metric not in ("availability", "extraction", "stage"):
        return jsonify({"error": "invalid metric, choose availability|extraction|stage"}), 400
    try:
        df = read_states_from_db(DB_PATH)
    except Exception as e:
        logging.exception("Failed to read DB")
        return jsonify({"error": str(e)}), 500

    dfm = df[["state", metric]].copy()
    dfm = dfm.dropna(subset=[metric])
    if dfm.empty:
        return jsonify({"items": []})
    dfm = dfm.sort_values(metric, ascending=False).head(10)
    items = []
    for _, r in dfm.iterrows():
        items.append({"state": r["state"], metric: float(r[metric])})
    return jsonify({"metric": metric, "items": items})


@app.route("/api/forecast")
def api_forecast():
    state = request.args.get("state", "All States (Aggregate)").strip()
    metric = request.args.get("metric")
    if not metric:
        return jsonify({"error": "metric query param required (availability|extraction|stage)"}), 400
    metric = metric.strip().lower()
    if metric not in ("availability", "extraction", "stage"):
        return jsonify({"error": "invalid metric"}), 400
    try:
        periods = int(request.args.get("periods", 5))
    except Exception:
        periods = 5
    try:
        base_year = int(request.args.get("base_year", 2024))
    except Exception:
        base_year = 2024
    mode = request.args.get("mode", "compound")
    if mode not in ("compound", "linear"):
        mode = "compound"
    try:
        rate = float(request.args.get("rate", 0.0))
    except Exception:
        rate = 0.0
    try:
        delta = float(request.args.get("delta", 0.0))
    except Exception:
        delta = 0.0

    try:
        df = read_states_from_db(DB_PATH)
    except Exception as e:
        logging.exception("Failed to read DB")
        return jsonify({"error": str(e)}), 500

    if state and state.strip().lower() in ("all states", "all states (aggregate)", "all_states_aggregate", "all_states"):
        base_val = float(df[metric].sum(skipna=True)) if not df[metric].dropna().empty else None
        label = "All States (Aggregate)"
    else:
        matches = df[df["state"].str.lower() == state.lower()]
        if matches.empty:
            mask = df["state"].str.lower().str.contains(state.lower())
            matches = df[mask]
        if matches.empty:
            return jsonify({"error": f"No data for state '{state}'. Try /api/states"}), 404
        base_val = float(matches.iloc[0][metric]) if not pd.isna(matches.iloc[0][metric]) else None
        label = str(matches.iloc[0]["state"])

    if base_val is None or (isinstance(base_val, float) and math.isnan(base_val)):
        return jsonify({"error": f"No numeric base value for metric '{metric}' for '{label}'"}), 400

    series = scenario_forecast_single_value(base_val, periods, mode, rate=rate, delta=delta)
    history = []
    forecast = []
    for offset, v in series:
        year = int(base_year + offset)
        if offset == 0:
            history.append({"year": year, "value": float(v)})
        else:
            forecast.append({"year": year, "value": float(v)})

    return jsonify({
        "state": label,
        "metric": metric,
        "base_year": base_year,
        "history": history,
        "forecast": forecast,
        "mode": mode,
        "rate": rate,
        "delta": delta
    })


if __name__ == "__main__":
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    logging.info("Using DB path: %s", DB_PATH)
    app.run(host="0.0.0.0", port=8080, debug=True)