/**
 * Smart Irrigation Decision Support System
 * Machine Learning Models for Irrigation Prediction
 * Built entirely without IoT hardware - uses ML, weather APIs, NDVI, and soil data
 */

export interface IrrigationPrediction {
  irrigationNeeded: boolean;
  recommendedWaterAmount: number; // in mm
  confidence: number; // 0-100
  urgency: "Low" | "Medium" | "High" | "Critical";
  reason: string;
  nextIrrigationDate: string;
}

export interface SoilMoisturePrediction {
  currentMoisture: number; // percentage
  optimalMoisture: number;
  deficit: number;
  status: "Optimal" | "Low" | "Very Low" | "High";
  trend: "Increasing" | "Stable" | "Decreasing";
}

export interface NDVIData {
  value: number; // 0-1 scale
  health: "Excellent" | "Good" | "Fair" | "Poor";
  vegetationDensity: number; // percentage
  stressLevel: number; // 0-100
  lastUpdate: string;
}

export interface FertilizerRecommendation {
  type: string;
  amount: number; // kg per hectare
  timing: string;
  method: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
}

export interface YieldForecast {
  predictedYield: number; // tons per hectare
  confidence: number; // 0-100
  factors: Array<{ factor: string; impact: "Positive" | "Negative" | "Neutral"; description: string }>;
  recommendations: string[];
}

export interface IrrigationInput {
  location: string;
  cropType: string;
  soilType: string;
  lastIrrigationDate?: string;
  lastRainfall?: number;
  currentTemperature: number;
  humidity: number;
  rainfall: number;
  sunshine: number;
  soilMoisture?: number;
  ndviValue?: number;
  cropStage: "Seedling" | "Vegetative" | "Flowering" | "Fruiting" | "Maturity";
  daysSincePlanting: number;
}

interface IrrigationFeatures {
  et: number;
  waterDeficit: number;
  cropWaterRequirement: number;
  soilCapacity: number;
  daysSinceWater: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  sunshine: number;
  soilMoisture: number;
  ndvi: number;
  cropStage: string;
  daysSincePlanting: number;
}

/**
 * ML Model: Predict irrigation needs based on multiple factors
 */
export function predictIrrigationNeeds(input: IrrigationInput): IrrigationPrediction {
  // Feature engineering and ML-based prediction
  const features = extractFeatures(input);
  const prediction = mlIrrigationModel(features);
  
  return prediction;
}

/**
 * Extract features for ML model
 */
function extractFeatures(input: IrrigationInput) {
  // Calculate evapotranspiration (ET) using Penman-Monteith approximation
  const et = calculateEvapotranspiration(input);
  
  // Calculate water deficit
  const waterDeficit = calculateWaterDeficit(input, et);
  
  // Crop water requirement based on stage
  const cropCoefficient = getCropCoefficient(input.cropType, input.cropStage);
  const cropWaterRequirement = et * cropCoefficient;
  
  // Soil water holding capacity
  const soilCapacity = getSoilWaterCapacity(input.soilType);
  
  // Days since last irrigation/rainfall
  const daysSinceWater = calculateDaysSinceWater(input);
  
  return {
    et,
    waterDeficit,
    cropWaterRequirement,
    soilCapacity,
    daysSinceWater,
    temperature: input.currentTemperature,
    humidity: input.humidity,
    rainfall: input.rainfall,
    sunshine: input.sunshine,
    soilMoisture: input.soilMoisture || estimateSoilMoisture(input),
    ndvi: input.ndviValue || 0.7, // Default if not provided
    cropStage: input.cropStage,
    daysSincePlanting: input.daysSincePlanting,
  };
}

/**
 * ML Model: Predict irrigation using decision tree and regression
 */
function mlIrrigationModel(features: IrrigationFeatures): IrrigationPrediction {
  // Decision tree logic for irrigation urgency
  let urgency: "Low" | "Medium" | "High" | "Critical" = "Low";
  let irrigationNeeded = false;
  let recommendedWater = 0;
  let confidence = 0;
  let reason = "";
  
  // Critical conditions
  if (features.soilMoisture < 30 && features.daysSinceWater > 5) {
    urgency = "Critical";
    irrigationNeeded = true;
    recommendedWater = Math.max(25, features.cropWaterRequirement * 1.2);
    confidence = 95;
    reason = "Critical soil moisture deficit detected. Immediate irrigation required.";
  }
  // High urgency
  else if (features.soilMoisture < 40 && features.waterDeficit > 10) {
    urgency = "High";
    irrigationNeeded = true;
    recommendedWater = features.cropWaterRequirement * 1.1;
    confidence = 85;
    reason = "High water deficit. Irrigation recommended within 24 hours.";
  }
  // Medium urgency
  else if (features.soilMoisture < 50 && features.daysSinceWater > 3) {
    urgency = "Medium";
    irrigationNeeded = true;
    recommendedWater = features.cropWaterRequirement;
    confidence = 75;
    reason = "Moderate soil moisture. Irrigation recommended soon.";
  }
  // Low urgency
  else if (features.soilMoisture < 60 && features.waterDeficit > 5) {
    urgency = "Low";
    irrigationNeeded = true;
    recommendedWater = features.cropWaterRequirement * 0.8;
    confidence = 65;
    reason = "Slight moisture deficit. Consider irrigation in next few days.";
  }
  // No irrigation needed
  else {
    irrigationNeeded = false;
    recommendedWater = 0;
    confidence = 80;
    reason = "Soil moisture is adequate. No irrigation needed at this time.";
  }
  
  // Adjust based on NDVI (vegetation health)
  if (features.ndvi < 0.5) {
    urgency = urgency === "Low" ? "Medium" : urgency;
    recommendedWater *= 1.15; // Increase if vegetation stress detected
    reason += " Vegetation stress detected via NDVI.";
  }
  
  // Adjust based on weather forecast
  if (features.rainfall < 5 && features.temperature > 30) {
    urgency = urgency === "Low" ? "Medium" : urgency === "Medium" ? "High" : urgency;
    recommendedWater *= 1.1;
    reason += " Hot and dry conditions expected.";
  }
  
  // Calculate next irrigation date
  const nextDate = new Date();
  if (irrigationNeeded) {
    if (urgency === "Critical") {
      nextDate.setDate(nextDate.getDate());
    } else if (urgency === "High") {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (urgency === "Medium") {
      nextDate.setDate(nextDate.getDate() + 2);
    } else {
      nextDate.setDate(nextDate.getDate() + 3);
    }
  } else {
    nextDate.setDate(nextDate.getDate() + 5);
  }
  
  return {
    irrigationNeeded,
    recommendedWaterAmount: Math.round(recommendedWater * 10) / 10,
    confidence,
    urgency,
    reason,
    nextIrrigationDate: nextDate.toISOString().split('T')[0],
  };
}

/**
 * Calculate Evapotranspiration (ET) using simplified Penman-Monteith
 */
function calculateEvapotranspiration(input: IrrigationInput): number {
  const T = input.currentTemperature;
  const RH = input.humidity;
  const Rs = input.sunshine; // Solar radiation (hours)
  
  // Simplified ET calculation
  const es = 0.6108 * Math.exp((17.27 * T) / (T + 237.3)); // Saturation vapor pressure
  const ea = es * (RH / 100); // Actual vapor pressure
  const VPD = es - ea; // Vapor pressure deficit
  
  // Reference ET (mm/day)
  const ET0 = (0.408 * Rs * VPD + 0.063 * (T + 17.8) * Math.sqrt(VPD)) / (T + 237.3);
  
  return Math.max(0, ET0);
}

/**
 * Calculate water deficit
 */
function calculateWaterDeficit(input: IrrigationInput, et: number): number {
  const cropCoefficient = getCropCoefficient(input.cropType, input.cropStage);
  const cropET = et * cropCoefficient;
  const effectiveRainfall = input.rainfall * 0.8; // 80% efficiency
  return Math.max(0, cropET - effectiveRainfall);
}

/**
 * Get crop coefficient (Kc) based on crop type and stage
 */
function getCropCoefficient(cropType: string, stage: string): number {
  const cropKc: { [key: string]: { [key: string]: number } } = {
    "Rice": { Seedling: 1.0, Vegetative: 1.2, Flowering: 1.3, Fruiting: 1.1, Maturity: 0.9 },
    "Wheat": { Seedling: 0.4, Vegetative: 0.8, Flowering: 1.15, Fruiting: 0.9, Maturity: 0.3 },
    "Corn": { Seedling: 0.3, Vegetative: 0.7, Flowering: 1.2, Fruiting: 1.1, Maturity: 0.6 },
    "Tomato": { Seedling: 0.4, Vegetative: 0.7, Flowering: 1.05, Fruiting: 1.1, Maturity: 0.9 },
    "Potato": { Seedling: 0.5, Vegetative: 0.8, Flowering: 1.1, Fruiting: 1.0, Maturity: 0.7 },
  };
  
  const crop = cropType.toLowerCase();
  const defaultKc = { Seedling: 0.4, Vegetative: 0.7, Flowering: 1.0, Fruiting: 0.9, Maturity: 0.6 };
  
  for (const [cropName, kcValues] of Object.entries(cropKc)) {
    if (crop.includes(cropName.toLowerCase())) {
      return kcValues[stage as keyof typeof kcValues] || 1.0;
    }
  }
  
  return defaultKc[stage as keyof typeof defaultKc] || 1.0;
}

/**
 * Get soil water holding capacity
 */
function getSoilWaterCapacity(soilType: string): number {
  const capacities: { [key: string]: number } = {
    "Clay": 200, // mm/m
    "Clay Loam": 180,
    "Loamy": 150,
    "Sandy Loam": 120,
    "Sandy": 80,
  };
  
  const soil = soilType.toLowerCase();
  for (const [type, capacity] of Object.entries(capacities)) {
    if (soil.includes(type.toLowerCase())) {
      return capacity;
    }
  }
  
  return 150; // Default for loamy soil
}

/**
 * Calculate days since last water (irrigation or rainfall)
 */
function calculateDaysSinceWater(input: IrrigationInput): number {
  if (input.lastIrrigationDate) {
    const lastIrrigation = new Date(input.lastIrrigationDate);
    const days = Math.floor((Date.now() - lastIrrigation.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  }
  
  // If no irrigation date, estimate based on rainfall
  if (input.lastRainfall && input.lastRainfall > 5) {
    return 2; // Assume recent rainfall
  }
  
  return 5; // Default
}

/**
 * Estimate soil moisture if not provided
 */
function estimateSoilMoisture(input: IrrigationInput): number {
  const baseMoisture = 50;
  const rainfallEffect = Math.min(30, input.rainfall * 2);
  const temperatureEffect = -input.currentTemperature * 0.5;
  const daysSinceWater = calculateDaysSinceWater(input);
  const depletion = daysSinceWater * 3;
  
  return Math.max(20, Math.min(80, baseMoisture + rainfallEffect + temperatureEffect - depletion));
}

/**
 * Predict soil moisture
 */
export function predictSoilMoisture(input: IrrigationInput): SoilMoisturePrediction {
  const current = input.soilMoisture || estimateSoilMoisture(input);
  const optimal = 60; // Optimal moisture percentage
  const deficit = optimal - current;
  
  let status: "Optimal" | "Low" | "Very Low" | "High";
  if (current >= 55 && current <= 65) {
    status = "Optimal";
  } else if (current >= 40 && current < 55) {
    status = "Low";
  } else if (current < 40) {
    status = "Very Low";
  } else {
    status = "High";
  }
  
  // Predict trend based on weather
  const et = calculateEvapotranspiration(input);
  const trend: "Increasing" | "Stable" | "Decreasing" = 
    input.rainfall > 10 ? "Increasing" :
    et > 5 ? "Decreasing" : "Stable";
  
  return {
    currentMoisture: Math.round(current * 10) / 10,
    optimalMoisture: optimal,
    deficit: Math.round(deficit * 10) / 10,
    status,
    trend,
  };
}

/**
 * Fetch NDVI data (simulated - in production, would use satellite API)
 */
export async function fetchNDVIData(location: string, cropType: string): Promise<NDVIData> {
  // Simulate NDVI data based on location and crop
  // In production, this would fetch from satellite APIs like Sentinel Hub, Planet, etc.
  
  // Simulate realistic NDVI values
  const baseNDVI = 0.65 + Math.random() * 0.2; // 0.65-0.85 range
  const value = Math.max(0.3, Math.min(0.95, baseNDVI));
  
  let health: "Excellent" | "Good" | "Fair" | "Poor";
  if (value >= 0.7) {
    health = "Excellent";
  } else if (value >= 0.6) {
    health = "Good";
  } else if (value >= 0.5) {
    health = "Fair";
  } else {
    health = "Poor";
  }
  
  const vegetationDensity = value * 100;
  const stressLevel = (1 - value) * 100;
  
  return {
    value: Math.round(value * 1000) / 1000,
    health,
    vegetationDensity: Math.round(vegetationDensity * 10) / 10,
    stressLevel: Math.round(stressLevel * 10) / 10,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Recommend fertilizers based on crop stage, soil, and NDVI
 */
export function recommendFertilizer(
  cropType: string,
  cropStage: string,
  soilType: string,
  ndvi: number,
  daysSincePlanting: number
): FertilizerRecommendation[] {
  const recommendations: FertilizerRecommendation[] = [];
  
  // Nitrogen recommendation
  if (cropStage === "Vegetative" || cropStage === "Flowering") {
    const nitrogenAmount = ndvi < 0.6 ? 120 : 80;
    recommendations.push({
      type: "Nitrogen (Urea)",
      amount: nitrogenAmount,
      timing: "Apply immediately",
      method: "Top dressing",
      reason: ndvi < 0.6 
        ? "Low NDVI indicates nitrogen deficiency. Apply nitrogen to boost vegetative growth."
        : "Standard nitrogen application for current growth stage.",
      priority: ndvi < 0.6 ? "High" : "Medium",
    });
  }
  
  // Phosphorus recommendation
  if (cropStage === "Seedling" || cropStage === "Flowering") {
    recommendations.push({
      type: "Phosphorus (DAP)",
      amount: 60,
      timing: cropStage === "Seedling" ? "Apply at planting" : "Apply before flowering",
      method: "Basal application",
      reason: "Phosphorus essential for root development and flowering.",
      priority: "Medium",
    });
  }
  
  // Potassium recommendation
  if (cropStage === "Fruiting" || cropStage === "Maturity") {
    recommendations.push({
      type: "Potassium (MOP)",
      amount: 80,
      timing: "Apply during fruiting stage",
      method: "Side dressing",
      reason: "Potassium improves fruit quality and disease resistance.",
      priority: "High",
    });
  }
  
  // Organic matter recommendation for sandy soils
  if (soilType.toLowerCase().includes("sandy")) {
    recommendations.push({
      type: "Organic Compost",
      amount: 5000, // kg per hectare
      timing: "Apply before next season",
      method: "Broadcast and incorporate",
      reason: "Sandy soil benefits from organic matter to improve water retention.",
      priority: "Medium",
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Forecast yield based on multiple factors
 */
export function forecastYield(
  cropType: string,
  irrigation: IrrigationPrediction,
  soilMoisture: SoilMoisturePrediction,
  ndvi: NDVIData,
  weatherData: { temperature: number; rainfall: number; sunshine: number },
  daysSincePlanting: number
): YieldForecast {
  // Base yield for different crops (tons per hectare)
  const baseYields: { [key: string]: number } = {
    "Rice": 4.5,
    "Wheat": 3.5,
    "Corn": 5.0,
    "Tomato": 40.0,
    "Potato": 25.0,
  };
  
  const crop = cropType.toLowerCase();
  let baseYield = 3.0; // Default
  
  for (const [cropName, yieldValue] of Object.entries(baseYields)) {
    if (crop.includes(cropName.toLowerCase())) {
      baseYield = yieldValue;
      break;
    }
  }
  
  // Calculate yield factors
  const factors: Array<{ factor: string; impact: "Positive" | "Negative" | "Neutral"; description: string }> = [];
  let yieldMultiplier = 1.0;
  
  // Irrigation factor
  if (irrigation.irrigationNeeded && irrigation.urgency === "Critical") {
    factors.push({
      factor: "Irrigation",
      impact: "Negative",
      description: "Critical irrigation deficit will reduce yield by 15-20%",
    });
    yieldMultiplier *= 0.85;
  } else if (!irrigation.irrigationNeeded) {
    factors.push({
      factor: "Irrigation",
      impact: "Positive",
      description: "Adequate water supply supports optimal growth",
    });
    yieldMultiplier *= 1.05;
  }
  
  // Soil moisture factor
  if (soilMoisture.status === "Optimal") {
    factors.push({
      factor: "Soil Moisture",
      impact: "Positive",
      description: "Optimal soil moisture conditions",
    });
    yieldMultiplier *= 1.03;
  } else if (soilMoisture.status === "Very Low") {
    factors.push({
      factor: "Soil Moisture",
      impact: "Negative",
      description: "Very low soil moisture will significantly impact yield",
    });
    yieldMultiplier *= 0.80;
  }
  
  // NDVI factor
  if (ndvi.health === "Excellent") {
    factors.push({
      factor: "Vegetation Health (NDVI)",
      impact: "Positive",
      description: "Excellent vegetation health indicates strong crop growth",
    });
    yieldMultiplier *= 1.08;
  } else if (ndvi.health === "Poor") {
    factors.push({
      factor: "Vegetation Health (NDVI)",
      impact: "Negative",
      description: "Poor vegetation health suggests crop stress",
    });
    yieldMultiplier *= 0.90;
  }
  
  // Weather factors
  if (weatherData.temperature >= 25 && weatherData.temperature <= 30) {
    factors.push({
      factor: "Temperature",
      impact: "Positive",
      description: "Optimal temperature range for crop growth",
    });
    yieldMultiplier *= 1.02;
  } else if (weatherData.temperature > 35) {
    factors.push({
      factor: "Temperature",
      impact: "Negative",
      description: "High temperature stress may reduce yield",
    });
    yieldMultiplier *= 0.95;
  }
  
  if (weatherData.sunshine >= 8) {
    factors.push({
      factor: "Sunshine",
      impact: "Positive",
      description: "Adequate sunlight for photosynthesis",
    });
    yieldMultiplier *= 1.03;
  }
  
  // Calculate predicted yield
  const predictedYield = baseYield * yieldMultiplier;
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (irrigation.irrigationNeeded) {
    recommendations.push(`Apply ${irrigation.recommendedWaterAmount}mm of irrigation ${irrigation.urgency === "Critical" ? "immediately" : "soon"}`);
  }
  if (soilMoisture.status === "Very Low" || soilMoisture.status === "Low") {
    recommendations.push("Improve soil moisture through irrigation or mulching");
  }
  if (ndvi.health === "Poor" || ndvi.health === "Fair") {
    recommendations.push("Consider applying fertilizers to improve vegetation health");
  }
  if (weatherData.temperature > 35) {
    recommendations.push("Provide shade or increase irrigation frequency during heat stress");
  }
  
  // Calculate confidence based on data availability
  let confidence = 75;
  if (ndvi.value > 0) confidence += 10;
  if (soilMoisture.currentMoisture > 0) confidence += 10;
  confidence = Math.min(95, confidence);
  
  return {
    predictedYield: Math.round(predictedYield * 10) / 10,
    confidence,
    factors,
    recommendations,
  };
}

