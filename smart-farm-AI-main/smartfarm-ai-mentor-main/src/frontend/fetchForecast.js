// path: src/frontend/fetchForecast.js
//
// Small helper to fetch forecast data used by the dashboard UI.
// - Tries /api/forecast?state=... (JSON)
// - If that fails, falls back to /static/forecasts/<State>_forecast.csv (CSV)
// - Returns { state, history: [{year, value}], forecast: [{year, value}] } or throws an Error.
//
// Usage:
//   import { getForecast } from './fetchForecast';
//   const data = await getForecast('All States (Aggregate)');
//

export async function getForecast(state = "All States (Aggregate)") {
    const apiUrl = `/api/forecast?state=${encodeURIComponent(state)}`;
    try {
      const res = await fetch(apiUrl, { credentials: "same-origin" });
      if (res.ok) {
        const json = await res.json();
        // simple validation
        if (json && (Array.isArray(json.history) || Array.isArray(json.forecast))) {
          return json;
        }
        // if response is not in expected shape, fallthrough to CSV fallback
        console.warn("API returned unexpected payload, falling back to CSV", json);
      } else {
        console.warn("API fetch failed:", res.status, res.statusText);
      }
    } catch (err) {
      console.warn("API fetch error:", err);
    }
  
    // CSV fallback: build filename and try to fetch static CSV
    const cleaned = (state || "All States (Aggregate)").replace(/ /g, "_").replace(/\//g, "_");
    const csvPath = `/static/forecasts/${cleaned}_forecast.csv`;
    try {
      const resp = await fetch(csvPath, { credentials: "same-origin" });
      if (!resp.ok) {
        throw new Error(`CSV fetch failed ${resp.status} ${resp.statusText}`);
      }
      const text = await resp.text();
      return parseForecastCsv(text, state);
    } catch (err) {
      console.error("Both API and CSV fallback failed:", err);
      throw new Error("Could not load forecast data for " + state + ". See console for details.");
    }
  }
  
  function parseForecastCsv(csvText, state) {
    // very small CSV parser that expects header: year,value,type
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      return { state, history: [], forecast: [] };
    }
    const header = lines[0].split(",").map(h => h.trim().toLowerCase());
    const idxYear = header.indexOf("year");
    const idxValue = header.indexOf("value");
    const idxType = header.indexOf("type");
    const history = [];
    const forecast = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const year = parseInt(cols[idxYear], 10);
      const val = parseFloat(cols[idxValue]);
      const typ = idxType >= 0 ? (cols[idxType] || "").trim().toLowerCase() : "";
      const rec = { year, value: isNaN(val) ? null : val };
      if (typ === "forecast") forecast.push(rec);
      else history.push(rec);
    }
    return { state, history, forecast };
  }