# path: src/model.py
"""
Provide forecasting utilities.

This file exposes:
 - forecast_arima(series, periods): fits a simple ARIMA/SARIMAX model and forecasts ahead
 - forecast_trend_lr(series, periods): fits a linear regression on year to forecast (fallback/simple baseline)

Notes:
 - The input "series" should be a pandas Series indexed by integer year (e.g., 2010,2011,...).
 - Forecasts will be returned as a pandas Series indexed by future integer years.
"""
from typing import Tuple

import numpy as np
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.linear_model import LinearRegression

def forecast_arima(series: pd.Series, periods: int = 5) -> pd.Series:
    """
    Fit a SARIMAX(1,1,1) with no seasonal terms to the series and forecast `periods` steps ahead.
    Returns a pandas Series with forecasted values indexed by year.
    """
    # Ensure series is sorted by index (year)
    s = series.sort_index()
    # If too few observations, raise
    if len(s.dropna()) < 3:
        raise ValueError("Not enough non-NaN observations for ARIMA. Need at least 3.")
    # statsmodels expects numeric index or RangeIndex; we'll use a simple approach
    # Fit SARIMAX on the values
    model = SARIMAX(s.values, order=(1, 1, 1), enforce_stationarity=False, enforce_invertibility=False)
    res = model.fit(disp=False)
    pred = res.get_forecast(steps=periods)
    forecasts = pred.predicted_mean
    last_year = int(s.index.max())
    future_years = [last_year + i for i in range(1, periods + 1)]
    return pd.Series(data=forecasts, index=future_years)

def forecast_trend_lr(series: pd.Series, periods: int = 5) -> pd.Series:
    """
    Fit a linear regression on the year (as integer) to value as a simple baseline.
    """
    s = series.sort_index()
    X = np.array(s.index).reshape(-1, 1)
    y = s.values
    # drop NaNs
    mask = ~np.isnan(y)
    if mask.sum() < 2:
        raise ValueError("Not enough data for linear regression.")
    X = X[mask]
    y = y[mask]
    lr = LinearRegression()
    lr.fit(X, y)
    last_year = int(s.index.max())
    future_years = np.array([last_year + i for i in range(1, periods + 1)]).reshape(-1, 1)
    preds = lr.predict(future_years)
    return pd.Series(data=preds, index=[int(y) for y in future_years.flatten()])

def choose_forecast(series: pd.Series, periods: int = 5) -> Tuple[pd.Series, str]:
    """
    Try ARIMA first, fall back to linear trend if ARIMA fails.
    Returns (forecast_series, method_name)
    """
    try:
        f = forecast_arima(series, periods=periods)
        return f, "arima(1,1,1)"
    except Exception:
        f = forecast_trend_lr(series, periods=periods)
        return f, "linear_trend"