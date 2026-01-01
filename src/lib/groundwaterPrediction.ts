/**
 * Groundwater Prediction Service
 * Implements time series forecasting for 5-year groundwater predictions
 */

import type { GroundwaterData } from './groundwaterApi';

export interface PredictionData {
  year: number;
  availability: number;
  utilization: number;
  extraction: number;
  confidenceLow: number;
  confidenceHigh: number;
}

export interface StatePrediction {
  state: string;
  currentYear: number;
  predictions: PredictionData[];
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Generate 5-year predictions for groundwater data
 */
export function generatePredictions(
  data: GroundwaterData,
  baseYear: number = 2024
): StatePrediction {
  const predictions: PredictionData[] = [];
  
  // Calculate growth rates based on current state
  const extractionRate = data.stageOfExtraction;
  
  // Determine growth/decline rates based on extraction stage
  let availabilityGrowthRate: number;
  let utilizationGrowthRate: number;
  let extractionGrowthRate: number;
  
  if (extractionRate > 70) {
    // Critical/Over-exploited: declining availability, increasing extraction
    availabilityGrowthRate = -0.03; // -3% per year
    utilizationGrowthRate = 0.04; // +4% per year
    extractionGrowthRate = 0.05; // +5% per year
  } else if (extractionRate > 40) {
    // Semi-critical: slow decline
    availabilityGrowthRate = -0.01; // -1% per year
    utilizationGrowthRate = 0.02; // +2% per year
    extractionGrowthRate = 0.02; // +2% per year
  } else {
    // Safe: stable or slight improvement
    availabilityGrowthRate = 0.01; // +1% per year
    utilizationGrowthRate = 0.015; // +1.5% per year
    extractionGrowthRate = 0.01; // +1% per year
  }
  
  // Account for monsoon recharge patterns
  const monsoonFactor = data.monsoonRecharge / (data.monsoonRecharge + data.nonMonsoonRecharge);
  if (monsoonFactor > 0.8) {
    // Highly dependent on monsoon - add variability
    availabilityGrowthRate *= 0.9; // Slightly more conservative
  }
  
  // Generate predictions for next 5 years
  for (let i = 1; i <= 5; i++) {
    const year = baseYear + i;
    
    // Calculate predicted values with compound growth
    const availability = data.netGroundwaterAvailability * Math.pow(1 + availabilityGrowthRate, i);
    const utilization = data.totalAnnualExtraction * Math.pow(1 + utilizationGrowthRate, i);
    const extraction = data.stageOfExtraction * Math.pow(1 + extractionGrowthRate, i);
    
    // Calculate confidence intervals (±10% for year 1, increasing to ±25% for year 5)
    const confidenceMargin = 0.1 + (i - 1) * 0.0375; // 10% to 25%
    
    predictions.push({
      year,
      availability: Math.max(0, availability),
      utilization: Math.max(0, utilization),
      extraction: Math.min(100, Math.max(0, extraction)),
      confidenceLow: Math.max(0, availability * (1 - confidenceMargin)),
      confidenceHigh: availability * (1 + confidenceMargin),
    });
  }
  
  // Determine trend
  const lastPrediction = predictions[predictions.length - 1];
  const trend = determineTrend(data.stageOfExtraction, lastPrediction.extraction);
  const riskLevel = determineRiskLevel(lastPrediction.extraction);
  
  return {
    state: data.state,
    currentYear: baseYear,
    predictions,
    trend,
    riskLevel,
  };
}

/**
 * Determine trend based on extraction changes
 */
function determineTrend(
  currentExtraction: number,
  futureExtraction: number
): 'improving' | 'stable' | 'declining' | 'critical' {
  const change = futureExtraction - currentExtraction;
  
  if (futureExtraction > 90) {
    return 'critical';
  } else if (change > 10) {
    return 'declining';
  } else if (change > -5 && change <= 10) {
    return 'stable';
  } else {
    return 'improving';
  }
}

/**
 * Determine risk level based on predicted extraction
 */
function determineRiskLevel(extraction: number): 'low' | 'medium' | 'high' | 'critical' {
  if (extraction > 90) return 'critical';
  if (extraction > 70) return 'high';
  if (extraction > 40) return 'medium';
  return 'low';
}

/**
 * Generate aggregate predictions for all states
 */
export function generateAggregatePredictions(
  allData: GroundwaterData[],
  baseYear: number = 2024
): PredictionData[] {
  const predictions: PredictionData[] = [];
  
  for (let i = 1; i <= 5; i++) {
    const year = baseYear + i;
    
    // Calculate aggregate values for all states
    let totalAvailability = 0;
    let totalUtilization = 0;
    let totalExtraction = 0;
    
    allData.forEach(stateData => {
      const statePrediction = generatePredictions(stateData, baseYear);
      const yearPrediction = statePrediction.predictions[i - 1];
      
      totalAvailability += yearPrediction.availability;
      totalUtilization += yearPrediction.utilization;
      totalExtraction += yearPrediction.extraction;
    });
    
    const avgExtraction = totalExtraction / allData.length;
    const confidenceMargin = 0.1 + (i - 1) * 0.0375;
    
    predictions.push({
      year,
      availability: totalAvailability,
      utilization: totalUtilization,
      extraction: avgExtraction,
      confidenceLow: totalAvailability * (1 - confidenceMargin),
      confidenceHigh: totalAvailability * (1 + confidenceMargin),
    });
  }
  
  return predictions;
}

/**
 * Calculate simple moving average for smoothing
 */
export function calculateMovingAverage(values: number[], window: number = 3): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, i + Math.ceil(window / 2));
    const slice = values.slice(start, end);
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    result.push(avg);
  }
  
  return result;
}

/**
 * Get prediction summary for a state
 */
export function getPredictionSummary(prediction: StatePrediction): string {
  const lastYear = prediction.predictions[prediction.predictions.length - 1];
  const extractionChange = lastYear.extraction - prediction.predictions[0].extraction;
  
  let summary = `${prediction.state} is currently `;
  
  if (prediction.riskLevel === 'critical') {
    summary += 'in a critical state with over-exploitation. ';
  } else if (prediction.riskLevel === 'high') {
    summary += 'at high risk of groundwater depletion. ';
  } else if (prediction.riskLevel === 'medium') {
    summary += 'showing moderate stress on groundwater resources. ';
  } else {
    summary += 'in a safe zone with sustainable extraction. ';
  }
  
  if (prediction.trend === 'improving') {
    summary += 'Conditions are expected to improve over the next 5 years.';
  } else if (prediction.trend === 'stable') {
    summary += 'Conditions are expected to remain stable.';
  } else if (prediction.trend === 'declining') {
    summary += `Extraction is projected to increase by ${extractionChange.toFixed(1)}% by ${lastYear.year}.`;
  } else {
    summary += 'Immediate intervention required to prevent severe depletion.';
  }
  
  return summary;
}