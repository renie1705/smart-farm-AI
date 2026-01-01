/**
 * Decision Tree Model for Crop Prediction
 * Uses dynamic decision flow based on environmental conditions
 */

export interface CropRequirements {
  name: string;
  optimalTemperature: { min: number; max: number };
  optimalRainfall: { min: number; max: number };
  soilTypes: string[];
  sunshineHours: { min: number; max: number };
  expectedYield: string;
  growthDuration: string;
  waterRequirement: "Low" | "Medium" | "High";
  marketValue: "Low" | "Medium" | "High";
}

export interface CropScore {
  crop: CropRequirements;
  suitability: number;
  reason: string;
  decisionPath: string[];
}

// Comprehensive crop database with requirements
const CROP_DATABASE: CropRequirements[] = [
  {
    name: "Rice",
    optimalTemperature: { min: 20, max: 35 },
    optimalRainfall: { min: 1000, max: 2500 },
    soilTypes: ["Loamy", "Clay", "Clay Loam"],
    sunshineHours: { min: 6, max: 12 },
    expectedYield: "4-6 tons per hectare",
    growthDuration: "120-150 days",
    waterRequirement: "High",
    marketValue: "High",
  },
  {
    name: "Wheat",
    optimalTemperature: { min: 15, max: 25 },
    optimalRainfall: { min: 500, max: 1000 },
    soilTypes: ["Loamy", "Sandy Loam", "Clay Loam"],
    sunshineHours: { min: 6, max: 10 },
    expectedYield: "3-5 tons per hectare",
    growthDuration: "100-120 days",
    waterRequirement: "Medium",
    marketValue: "High",
  },
  {
    name: "Corn (Maize)",
    optimalTemperature: { min: 18, max: 30 },
    optimalRainfall: { min: 600, max: 1200 },
    soilTypes: ["Loamy", "Sandy Loam", "Clay Loam"],
    sunshineHours: { min: 8, max: 12 },
    expectedYield: "5-8 tons per hectare",
    growthDuration: "90-110 days",
    waterRequirement: "Medium",
    marketValue: "Medium",
  },
  {
    name: "Sugarcane",
    optimalTemperature: { min: 26, max: 32 },
    optimalRainfall: { min: 1200, max: 2500 },
    soilTypes: ["Loamy", "Clay", "Sandy Loam"],
    sunshineHours: { min: 8, max: 12 },
    expectedYield: "60-80 tons per hectare",
    growthDuration: "300-365 days",
    waterRequirement: "High",
    marketValue: "High",
  },
  {
    name: "Cotton",
    optimalTemperature: { min: 21, max: 30 },
    optimalRainfall: { min: 500, max: 1000 },
    soilTypes: ["Loamy", "Sandy Loam", "Black Soil"],
    sunshineHours: { min: 8, max: 12 },
    expectedYield: "2-3 tons per hectare",
    growthDuration: "150-180 days",
    waterRequirement: "Medium",
    marketValue: "High",
  },
  {
    name: "Soybean",
    optimalTemperature: { min: 20, max: 30 },
    optimalRainfall: { min: 450, max: 900 },
    soilTypes: ["Loamy", "Sandy Loam", "Clay Loam"],
    sunshineHours: { min: 6, max: 10 },
    expectedYield: "2-3 tons per hectare",
    growthDuration: "90-120 days",
    waterRequirement: "Medium",
    marketValue: "Medium",
  },
  {
    name: "Potato",
    optimalTemperature: { min: 15, max: 25 },
    optimalRainfall: { min: 500, max: 750 },
    soilTypes: ["Sandy Loam", "Loamy", "Well-drained"],
    sunshineHours: { min: 6, max: 10 },
    expectedYield: "20-30 tons per hectare",
    growthDuration: "90-120 days",
    waterRequirement: "Medium",
    marketValue: "Medium",
  },
  {
    name: "Tomato",
    optimalTemperature: { min: 18, max: 28 },
    optimalRainfall: { min: 400, max: 800 },
    soilTypes: ["Loamy", "Sandy Loam", "Well-drained"],
    sunshineHours: { min: 6, max: 10 },
    expectedYield: "40-60 tons per hectare",
    growthDuration: "90-120 days",
    waterRequirement: "Medium",
    marketValue: "High",
  },
  {
    name: "Millet",
    optimalTemperature: { min: 20, max: 35 },
    optimalRainfall: { min: 300, max: 600 },
    soilTypes: ["Sandy", "Sandy Loam", "Loamy"],
    sunshineHours: { min: 8, max: 12 },
    expectedYield: "1.5-2.5 tons per hectare",
    growthDuration: "70-90 days",
    waterRequirement: "Low",
    marketValue: "Medium",
  },
  {
    name: "Groundnut (Peanut)",
    optimalTemperature: { min: 25, max: 35 },
    optimalRainfall: { min: 500, max: 1000 },
    soilTypes: ["Sandy Loam", "Loamy", "Well-drained"],
    sunshineHours: { min: 8, max: 12 },
    expectedYield: "2-3 tons per hectare",
    growthDuration: "100-130 days",
    waterRequirement: "Medium",
    marketValue: "High",
  },
  {
    name: "Sunflower",
    optimalTemperature: { min: 18, max: 30 },
    optimalRainfall: { min: 400, max: 800 },
    soilTypes: ["Loamy", "Sandy Loam", "Clay Loam"],
    sunshineHours: { min: 8, max: 12 },
    expectedYield: "1.5-2.5 tons per hectare",
    growthDuration: "90-100 days",
    waterRequirement: "Low",
    marketValue: "Medium",
  },
  {
    name: "Barley",
    optimalTemperature: { min: 12, max: 22 },
    optimalRainfall: { min: 400, max: 800 },
    soilTypes: ["Loamy", "Sandy Loam", "Well-drained"],
    sunshineHours: { min: 6, max: 10 },
    expectedYield: "2-4 tons per hectare",
    growthDuration: "90-110 days",
    waterRequirement: "Low",
    marketValue: "Medium",
  },
];

/**
 * Decision Tree Node - Represents a decision point in the tree
 */
interface DecisionNode {
  condition: (data: PredictionInput) => boolean;
  weight: number;
  description: string;
}

/**
 * Input data for crop prediction
 */
export interface PredictionInput {
  location: string;
  soilType: string;
  rainfall: number;
  temperature: number;
  sunshine?: number;
  humidity?: number;
}

/**
 * Calculate suitability score for a crop based on decision tree
 */
function calculateCropScore(
  crop: CropRequirements,
  input: PredictionInput
): CropScore {
  const decisionPath: string[] = [];
  let totalScore = 0;
  let maxScore = 0;
  const reasons: string[] = [];

  // Decision Tree Node 1: Temperature Check
  const tempScore = evaluateTemperature(crop, input.temperature);
  totalScore += tempScore.score;
  maxScore += tempScore.max;
  decisionPath.push(`Temperature: ${tempScore.description}`);
  if (tempScore.score > 0) reasons.push(tempScore.reason);

  // Decision Tree Node 2: Rainfall Check
  const rainfallScore = evaluateRainfall(crop, input.rainfall);
  totalScore += rainfallScore.score;
  maxScore += rainfallScore.max;
  decisionPath.push(`Rainfall: ${rainfallScore.description}`);
  if (rainfallScore.score > 0) reasons.push(rainfallScore.reason);

  // Decision Tree Node 3: Soil Type Check
  const soilScore = evaluateSoilType(crop, input.soilType);
  totalScore += soilScore.score;
  maxScore += soilScore.max;
  decisionPath.push(`Soil: ${soilScore.description}`);
  if (soilScore.score > 0) reasons.push(soilScore.reason);

  // Decision Tree Node 4: Sunshine Hours (if available)
  if (input.sunshine !== undefined) {
    const sunshineScore = evaluateSunshine(crop, input.sunshine);
    totalScore += sunshineScore.score;
    maxScore += sunshineScore.max;
    decisionPath.push(`Sunshine: ${sunshineScore.description}`);
    if (sunshineScore.score > 0) reasons.push(sunshineScore.reason);
  }

  // Decision Tree Node 5: Market Value Bonus
  const marketBonus = getMarketValueBonus(crop);
  totalScore += marketBonus.score;
  maxScore += marketBonus.max;
  decisionPath.push(`Market Value: ${marketBonus.description}`);

  // Calculate final suitability percentage
  const suitability = Math.round((totalScore / maxScore) * 100);
  const suitabilityClamped = Math.min(100, Math.max(0, suitability));

  // Generate comprehensive reason
  const reason = generateReason(crop, input, reasons, suitabilityClamped);

  return {
    crop,
    suitability: suitabilityClamped,
    reason,
    decisionPath,
  };
}

/**
 * Decision Tree Node: Temperature Evaluation
 */
function evaluateTemperature(
  crop: CropRequirements,
  temperature: number
): { score: number; max: number; description: string; reason: string } {
  const { min, max } = crop.optimalTemperature;
  const maxScore = 30; // Weight: 30%

  if (temperature >= min && temperature <= max) {
    // Optimal range
    const center = (min + max) / 2;
    const distanceFromCenter = Math.abs(temperature - center);
    const range = max - min;
    const optimality = 1 - distanceFromCenter / (range / 2);
    const score = maxScore * Math.max(0.7, optimality);
    return {
      score,
      max: maxScore,
      description: "Optimal",
      reason: `Temperature (${temperature}°C) is within optimal range (${min}-${max}°C)`,
    };
  } else if (temperature < min - 5 || temperature > max + 5) {
    // Too far from range
    return {
      score: 0,
      max: maxScore,
      description: "Unsuitable",
      reason: `Temperature (${temperature}°C) is outside acceptable range for ${crop.name}`,
    };
  } else {
    // Near optimal (within 5°C)
    const distance = temperature < min ? min - temperature : temperature - max;
    const score = maxScore * (1 - distance / 5) * 0.6;
    return {
      score,
      max: maxScore,
      description: "Marginal",
      reason: `Temperature (${temperature}°C) is near optimal range but may affect growth`,
    };
  }
}

/**
 * Decision Tree Node: Rainfall Evaluation
 */
function evaluateRainfall(
  crop: CropRequirements,
  rainfall: number
): { score: number; max: number; description: string; reason: string } {
  const { min, max } = crop.optimalRainfall;
  const maxScore = 25; // Weight: 25%

  if (rainfall >= min && rainfall <= max) {
    // Optimal range
    const center = (min + max) / 2;
    const distanceFromCenter = Math.abs(rainfall - center);
    const range = max - min;
    const optimality = 1 - distanceFromCenter / (range / 2);
    const score = maxScore * Math.max(0.7, optimality);
    return {
      score,
      max: maxScore,
      description: "Optimal",
      reason: `Rainfall (${rainfall}mm) matches water requirements`,
    };
  } else if (rainfall < min * 0.5 || rainfall > max * 1.5) {
    // Too far from range
    return {
      score: 0,
      max: maxScore,
      description: "Unsuitable",
      reason: `Rainfall (${rainfall}mm) is insufficient or excessive for ${crop.name}`,
    };
  } else {
    // Near optimal
    const distance = rainfall < min ? min - rainfall : rainfall - max;
    const maxDistance = rainfall < min ? min * 0.5 : max * 0.5;
    const score = maxScore * (1 - distance / maxDistance) * 0.6;
    return {
      score,
      max: maxScore,
      description: "Marginal",
      reason: `Rainfall (${rainfall}mm) is close to optimal but may require irrigation or drainage`,
    };
  }
}

/**
 * Decision Tree Node: Soil Type Evaluation
 */
function evaluateSoilType(
  crop: CropRequirements,
  soilType: string
): { score: number; max: number; description: string; reason: string } {
  const maxScore = 20; // Weight: 20%
  const normalizedSoilType = soilType.toLowerCase().trim();

  // Check for exact match
  const exactMatch = crop.soilTypes.some(
    (soil) => soil.toLowerCase() === normalizedSoilType
  );
  if (exactMatch) {
    return {
      score: maxScore,
      max: maxScore,
      description: "Ideal",
      reason: `${soilType} soil is ideal for ${crop.name}`,
    };
  }

  // Check for partial match (e.g., "Loamy" matches "Sandy Loam")
  const partialMatch = crop.soilTypes.some((soil) =>
    normalizedSoilType.includes(soil.toLowerCase()) ||
    soil.toLowerCase().includes(normalizedSoilType)
  );
  if (partialMatch) {
    return {
      score: maxScore * 0.7,
      max: maxScore,
      description: "Suitable",
      reason: `${soilType} soil is compatible with ${crop.name} requirements`,
    };
  }

  // Check for similar soil types
  const soilCompatibility: { [key: string]: string[] } = {
    loamy: ["sandy loam", "clay loam", "silt loam"],
    "sandy loam": ["loamy", "sandy"],
    "clay loam": ["loamy", "clay"],
    clay: ["clay loam"],
    sandy: ["sandy loam"],
  };

  const compatibleSoils = soilCompatibility[normalizedSoilType] || [];
  const hasCompatible = crop.soilTypes.some((cropSoil) =>
    compatibleSoils.some((comp) =>
      cropSoil.toLowerCase().includes(comp) || comp.includes(cropSoil.toLowerCase())
    )
  );

  if (hasCompatible) {
    return {
      score: maxScore * 0.5,
      max: maxScore,
      description: "Moderate",
      reason: `${soilType} soil can work with ${crop.name} but may need soil amendments`,
    };
  }

  return {
    score: maxScore * 0.2,
    max: maxScore,
    description: "Challenging",
    reason: `${soilType} soil is not ideal for ${crop.name}, significant soil preparation needed`,
  };
}

/**
 * Decision Tree Node: Sunshine Hours Evaluation
 */
function evaluateSunshine(
  crop: CropRequirements,
  sunshine: number
): { score: number; max: number; description: string; reason: string } {
  const { min, max } = crop.sunshineHours;
  const maxScore = 15; // Weight: 15%

  if (sunshine >= min && sunshine <= max) {
    const center = (min + max) / 2;
    const distanceFromCenter = Math.abs(sunshine - center);
    const range = max - min;
    const optimality = 1 - distanceFromCenter / (range / 2);
    const score = maxScore * Math.max(0.7, optimality);
    return {
      score,
      max: maxScore,
      description: "Optimal",
      reason: `Sunshine hours (${sunshine}h) are within optimal range`,
    };
  } else {
    const distance = sunshine < min ? min - sunshine : sunshine - max;
    const maxDistance = sunshine < min ? min * 0.5 : max * 0.5;
    const score = maxScore * Math.max(0, 1 - distance / maxDistance) * 0.6;
    return {
      score,
      max: maxScore,
      description: "Marginal",
      reason: `Sunshine hours (${sunshine}h) are outside optimal range`,
    };
  }
}

/**
 * Decision Tree Node: Market Value Bonus
 */
function getMarketValueBonus(
  crop: CropRequirements
): { score: number; max: number; description: string } {
  const maxScore = 10; // Weight: 10%
  const marketValueMap = { High: 10, Medium: 6, Low: 3 };
  return {
    score: marketValueMap[crop.marketValue],
    max: maxScore,
    description: crop.marketValue,
  };
}

/**
 * Generate comprehensive reason for crop recommendation
 */
function generateReason(
  crop: CropRequirements,
  input: PredictionInput,
  reasons: string[],
  suitability: number
): string {
  let reason = `${crop.name} is `;

  if (suitability >= 80) {
    reason += "highly suitable for your conditions. ";
  } else if (suitability >= 60) {
    reason += "well-suited for your farm. ";
  } else if (suitability >= 40) {
    reason += "moderately suitable with some considerations. ";
  } else {
    reason += "marginally suitable and may require significant adjustments. ";
  }

  if (reasons.length > 0) {
    reason += reasons.join(" ") + ". ";
  }

  // Add specific recommendations
  if (crop.waterRequirement === "High" && input.rainfall < crop.optimalRainfall.min) {
    reason += "Note: This crop requires high water availability; ensure adequate irrigation. ";
  }

  if (crop.marketValue === "High") {
    reason += "This crop has high market value and good profit potential. ";
  }

  return reason.trim();
}

/**
 * Main Decision Tree Prediction Function
 * Uses dynamic flow to evaluate all crops and return top recommendations
 */
export function predictCropsWithDecisionTree(
  input: PredictionInput
): CropScore[] {
  // Validate input
  if (!input.soilType || !input.rainfall || !input.temperature) {
    throw new Error("Missing required input parameters");
  }

  // Evaluate all crops using decision tree
  const scores: CropScore[] = CROP_DATABASE.map((crop) =>
    calculateCropScore(crop, input)
  );

  // Sort by suitability (descending)
  scores.sort((a, b) => b.suitability - a.suitability);

  // Return top 3 recommendations
  return scores.slice(0, 3);
}

/**
 * Get decision tree visualization data
 */
export function getDecisionTreePath(
  crop: CropRequirements,
  input: PredictionInput
): {
  nodes: Array<{ name: string; value: string; status: "optimal" | "good" | "marginal" | "poor" }>;
  finalScore: number;
} {
  const score = calculateCropScore(crop, input);
  const nodes = score.decisionPath.map((path) => {
    const [key, value] = path.split(": ");
    let status: "optimal" | "good" | "marginal" | "poor" = "marginal";
    
    if (value.toLowerCase().includes("optimal") || value.toLowerCase().includes("ideal")) {
      status = "optimal";
    } else if (value.toLowerCase().includes("suitable") || value.toLowerCase().includes("good")) {
      status = "good";
    } else if (value.toLowerCase().includes("marginal") || value.toLowerCase().includes("moderate")) {
      status = "marginal";
    } else {
      status = "poor";
    }

    return { name: key, value, status };
  });

  return {
    nodes,
    finalScore: score.suitability,
  };
}

