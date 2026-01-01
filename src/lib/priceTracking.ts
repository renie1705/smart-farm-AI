/**
 * Price Tracking & Best Supplier Alert System
 * Integrates with AgMarkNet (https://agmarknet.gov.in/) for real-time agricultural commodity prices
 * Includes 3-day price prediction using AI models
 */

export interface CommodityPrice {
  id: string;
  commodityName: string;
  market: string;
  state: string;
  price: number; // Price per quintal
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: Date;
  arrivalQuantity: number;
  unit: string; // quintals, kg, etc.
}

export interface SupplierInfo {
  id: string;
  name: string;
  market: string;
  state: string;
  commodities: string[];
  avgRating: number;
  contactInfo: string;
}

export interface PricePrediction {
  date: Date;
  predictedPrice: number;
  confidence: number; // 0-1
  trend: "up" | "down" | "stable";
  priceChange: number;
}

export interface PriceAlert {
  id: string;
  commodityName: string;
  market: string;
  currentPrice: number;
  alertType: "high" | "low" | "best_deal";
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: Date;
}

export interface HistoricalPrice {
  date: Date;
  price: number;
  market: string;
  commodity: string;
}

/**
 * Fetch commodity prices from AgMarkNet for all states
 * In production, this would call the actual AgMarkNet API
 * For now, it uses mock data that simulates real market data across all Indian states
 */
export async function fetchAgMarkNetPrices(
  commodities: string[],
  states: string[] = []
): Promise<CommodityPrice[]> {
  try {
    // Mock data simulating AgMarkNet API response for all major Indian states
    // In production, replace with actual API calls:
    // const response = await fetch(`https://agmarknet.gov.in/api/...`)
    
    const allStates = [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
      "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
      "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
      "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
      "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
      "Delhi", "Puducherry"
    ];

    const statesToFetch = states.length > 0 ? states : allStates;
    const allCommodities = commodities.length > 0 ? commodities : 
      [
        // Cereals
        "Wheat", "Rice", "Maize", "Bajra", "Jowar", "Barley",
        // Pulses
        "Chickpea", "Lentil", "Moong", "Urad", "Peas", "Masoor",
        // Oilseeds
        "Soybeans", "Groundnut", "Sunflower", "Mustard", "Rapeseed", "Sesame",
        // Cash Crops
        "Cotton", "Sugarcane", "Tobacco", "Jute", "Coconut",
        // Vegetables
        "Onions", "Potato", "Tomato", "Cabbage", "Cauliflower", "Carrot", "Radish", "Cucumber", "Capsicum", "Beans",
        // Fruits
        "Apple", "Banana", "Orange", "Mango", "Grape", "Strawberry", "Papaya", "Pineapple", "Guava", "Watermelon",
        // Spices
        "Turmeric", "Chili", "Coriander", "Cumin", "Fenugreek", "Black Pepper",
        // Condiments
        "Garlic", "Ginger", "Fenugreek Seed",
        // Other important crops
        "Arhar", "Gram", "Tea", "Coffee", "Cardamom"
      ];

    const mockData: CommodityPrice[] = [];
    const marketNames: { [key: string]: string[] } = {
      "Andhra Pradesh": ["Hyderabad", "Vijayawada", "Visakhapatnam"],
      "Arunachal Pradesh": ["Itanagar"],
      "Assam": ["Guwahati", "Dibrugarh"],
      "Bihar": ["Patna", "Muzaffarpur", "Darbhanga"],
      "Chhattisgarh": ["Raipur", "Durg"],
      "Goa": ["Panaji"],
      "Gujarat": ["Ahmedabad", "Vadodara", "Rajkot", "Surat"],
      "Haryana": ["Faridabad", "Hisar", "Rohtak"],
      "Himachal Pradesh": ["Shimla", "Mandi"],
      "Jharkhand": ["Ranchi", "Dhanbad"],
      "Karnataka": ["Bangalore", "Mysore", "Belgaum"],
      "Kerala": ["Kochi", "Thiruvananthapuram"],
      "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur"],
      "Maharashtra": ["Mumbai", "Aurangabad", "Pune", "Nashik"],
      "Manipur": ["Imphal"],
      "Meghalaya": ["Shillong"],
      "Mizoram": ["Aizawl"],
      "Nagaland": ["Kohima"],
      "Odisha": ["Bhubaneswar", "Cuttack"],
      "Punjab": ["Jalandhar", "Ludhiana", "Amritsar"],
      "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur"],
      "Sikkim": ["Gangtok"],
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
      "Telangana": ["Hyderabad", "Warangal"],
      "Tripura": ["Agartala"],
      "Uttar Pradesh": ["Lucknow", "Varanasi", "Kanpur", "Meerut"],
      "Uttarakhand": ["Dehradun", "Haldwani"],
      "West Bengal": ["Kolkata", "Darjeeling"],
      "Delhi": ["Delhi"],
      "Puducherry": ["Puducherry"]
    };

    const basePrices: { [key: string]: number } = {
      // Cereals
      "Wheat": 2150,
      "Rice": 2850,
      "Maize": 1950,
      "Bajra": 1850,
      "Jowar": 1750,
      "Barley": 1650,
      // Pulses
      "Chickpea": 5250,
      "Lentil": 6150,
      "Moong": 6850,
      "Urad": 7250,
      "Peas": 4950,
      "Masoor": 5550,
      // Oilseeds
      "Soybeans": 4150,
      "Groundnut": 5850,
      "Sunflower": 6050,
      "Mustard": 5450,
      "Rapeseed": 5650,
      "Sesame": 8250,
      // Cash Crops
      "Cotton": 6200,
      "Sugarcane": 2800,
      "Tobacco": 8500,
      "Jute": 3850,
      "Coconut": 12500,
      // Vegetables
      "Onions": 1850,
      "Potato": 1200,
      "Tomato": 1500,
      "Cabbage": 800,
      "Cauliflower": 1200,
      "Carrot": 950,
      "Radish": 650,
      "Cucumber": 750,
      "Capsicum": 2500,
      "Beans": 1800,
      // Fruits
      "Apple": 4500,
      "Banana": 3200,
      "Orange": 2800,
      "Mango": 3500,
      "Grape": 5200,
      "Strawberry": 6800,
      "Papaya": 1500,
      "Pineapple": 2200,
      "Guava": 1800,
      "Watermelon": 900,
      // Spices
      "Turmeric": 7850,
      "Chili": 8500,
      "Coriander": 9200,
      "Cumin": 11500,
      "Fenugreek": 8200,
      "Black Pepper": 35000,
      // Condiments
      "Garlic": 2800,
      "Ginger": 3500,
      "Fenugreek Seed": 5200,
      // Other important crops
      "Arhar": 6250,
      "Gram": 5800,
      "Tea": 18500,
      "Coffee": 22000,
      "Cardamom": 45000,
    };

    let id = 0;
    for (const state of statesToFetch) {
      const markets = marketNames[state] || [state];
      for (const market of markets) {
        for (const commodity of allCommodities) {
          const basePrice = basePrices[commodity] || 2000;
          const stateVariation = Math.random() * 400 - 200; // ±200
          const marketVariation = Math.random() * 300 - 150; // ±150
          const price = basePrice + stateVariation + marketVariation;

          mockData.push({
            id: `${id++}`,
            commodityName: commodity,
            market: market,
            state: state,
            price: Math.max(100, price),
            minPrice: Math.max(100, price - 100),
            maxPrice: price + 100,
            modalPrice: price,
            date: new Date(),
            arrivalQuantity: Math.floor(Math.random() * 10000) + 1000,
            unit: "quintals",
          });
        }
      }
    }

    return mockData;
  } catch (error) {
    console.error("Error fetching AgMarkNet prices:", error);
    return [];
  }
}

/**
 * ARIMA-like simple time series prediction for 3-day price forecast
 * Uses exponential smoothing and trend analysis
 */
export function predict3DayPrices(
  historicalPrices: HistoricalPrice[]
): PricePrediction[] {
  if (historicalPrices.length === 0) return [];

  // Sort by date ascending
  const sorted = [...historicalPrices].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const prices = sorted.map((p) => p.price);
  const n = prices.length;

  if (n < 2) {
    // Not enough data for prediction
    const currentPrice = prices[0];
    return [
      {
        date: addDays(new Date(), 1),
        predictedPrice: currentPrice,
        confidence: 0.5,
        trend: "stable",
        priceChange: 0,
      },
      {
        date: addDays(new Date(), 2),
        predictedPrice: currentPrice,
        confidence: 0.4,
        trend: "stable",
        priceChange: 0,
      },
      {
        date: addDays(new Date(), 3),
        predictedPrice: currentPrice,
        confidence: 0.3,
        trend: "stable",
        priceChange: 0,
      },
    ];
  }

  // Simple linear regression for trend
  const mean_x = (n - 1) / 2;
  const mean_y = prices.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - mean_x) * (prices[i] - mean_y);
    denominator += Math.pow(i - mean_x, 2);
  }

  const slope = numerator / (denominator || 1);
  const intercept = mean_y - slope * mean_x;

  // Exponential smoothing coefficient
  const alpha = 0.3;
  let smoothed = prices[0];
  for (let i = 1; i < n; i++) {
    smoothed = alpha * prices[i] + (1 - alpha) * smoothed;
  }

  // Generate 3-day predictions
  const predictions: PricePrediction[] = [];
  for (let day = 1; day <= 3; day++) {
    const predictedPrice = intercept + slope * (n - 1 + day);
    const lastPrice = prices[n - 1];
    const priceChange = predictedPrice - lastPrice;

    // Confidence decreases with prediction horizon
    const baseConfidence = 0.85 - day * 0.15;
    const volatility = calculateVolatility(prices);
    const confidence = Math.max(0.3, baseConfidence - volatility * 0.1);

    // Determine trend
    let trend: "up" | "down" | "stable";
    if (Math.abs(priceChange) < lastPrice * 0.02) {
      trend = "stable";
    } else if (priceChange > 0) {
      trend = "up";
    } else {
      trend = "down";
    }

    predictions.push({
      date: addDays(new Date(), day),
      predictedPrice: Math.max(0, predictedPrice),
      confidence,
      trend,
      priceChange,
    });
  }

  return predictions;
}

/**
 * Calculate volatility (standard deviation) of prices
 */
function calculateVolatility(prices: number[]): number {
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance =
    prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Generate price alerts based on thresholds and predictions
 */
export function generatePriceAlerts(
  currentPrices: CommodityPrice[],
  predictions: Map<string, PricePrediction[]>,
  userThresholds: Map<string, { highPrice: number; lowPrice: number }>
): PriceAlert[] {
  const alerts: PriceAlert[] = [];
  const seenAlerts = new Set<string>();

  for (const price of currentPrices) {
    const key = `${price.commodityName}-${price.market}`;
    const threshold = userThresholds.get(key);
    const prediction = predictions.get(key);

    // Check for high price alert
    if (threshold && price.price > threshold.highPrice) {
      const alertId = `high-${key}`;
      if (!seenAlerts.has(alertId)) {
        alerts.push({
          id: alertId,
          commodityName: price.commodityName,
          market: price.market,
          currentPrice: price.price,
          alertType: "high",
          message: `⚠️ ${price.commodityName} in ${price.market} is selling at ₹${price.price}/quintal, above your threshold of ₹${threshold.highPrice}.`,
          severity: "medium",
          timestamp: new Date(),
        });
        seenAlerts.add(alertId);
      }
    }

    // Check for low price alert (best deal)
    if (threshold && price.price < threshold.lowPrice) {
      const alertId = `low-${key}`;
      if (!seenAlerts.has(alertId)) {
        alerts.push({
          id: alertId,
          commodityName: price.commodityName,
          market: price.market,
          currentPrice: price.price,
          alertType: "best_deal",
          message: `✅ Best Deal! ${price.commodityName} in ${price.market} is selling at ₹${price.price}/quintal, below your alert of ₹${threshold.lowPrice}.`,
          severity: "high",
          timestamp: new Date(),
        });
        seenAlerts.add(alertId);
      }
    }

    // Check for predicted price movement
    if (prediction && prediction.length > 0) {
      const nextPrediction = prediction[0];
      if (
        nextPrediction.trend === "up" &&
        nextPrediction.priceChange > price.price * 0.05
      ) {
        const alertId = `trend-up-${key}`;
        if (!seenAlerts.has(alertId)) {
          alerts.push({
            id: alertId,
            commodityName: price.commodityName,
            market: price.market,
            currentPrice: price.price,
            alertType: "high",
            message: `📈 Price predicted to rise! ${price.commodityName} is expected to increase by ₹${nextPrediction.priceChange.toFixed(0)} in next 24hrs.`,
            severity: "medium",
            timestamp: new Date(),
          });
          seenAlerts.add(alertId);
        }
      } else if (
        nextPrediction.trend === "down" &&
        nextPrediction.priceChange < price.price * -0.05
      ) {
        const alertId = `trend-down-${key}`;
        if (!seenAlerts.has(alertId)) {
          alerts.push({
            id: alertId,
            commodityName: price.commodityName,
            market: price.market,
            currentPrice: price.price,
            alertType: "low",
            message: `📉 Price predicted to drop! ${price.commodityName} is expected to decrease by ₹${Math.abs(nextPrediction.priceChange).toFixed(0)} in next 24hrs.`,
            severity: "low",
            timestamp: new Date(),
          });
          seenAlerts.add(alertId);
        }
      }
    }
  }

  return alerts;
}

/**
 * Find best suppliers based on current prices and ratings
 */
export function findBestSuppliers(
  prices: CommodityPrice[],
  commodity: string,
  topN: number = 3
): CommodityPrice[] {
  return prices
    .filter((p) => p.commodityName.toLowerCase() === commodity.toLowerCase())
    .sort((a, b) => a.price - b.price)
    .slice(0, topN);
}

/**
 * Calculate price statistics
 */
export function calculatePriceStats(prices: CommodityPrice[]) {
  if (prices.length === 0) {
    return {
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      priceRange: 0,
      volatility: 0,
    };
  }

  const priceValues = prices.map((p) => p.price);
  const avgPrice =
    priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const priceRange = maxPrice - minPrice;
  const volatility = calculateVolatility(priceValues);

  return {
    avgPrice,
    minPrice,
    maxPrice,
    priceRange,
    volatility,
  };
}

/**
 * Get market trends - which states have lowest prices for a commodity
 */
export function getMarketTrends(
  prices: CommodityPrice[],
  commodity: string
): Map<string, number> {
  const trends = new Map<string, number>();

  for (const price of prices) {
    if (price.commodityName.toLowerCase() === commodity.toLowerCase()) {
      const key = price.state;
      if (!trends.has(key) || trends.get(key)! > price.price) {
        trends.set(key, price.price);
      }
    }
  }

  return trends;
}

/**
 * Mock historical price data for testing predictions
 */
export function getMockHistoricalPrices(
  commodity: string,
  market: string,
  days: number = 30
): HistoricalPrice[] {
  const prices: HistoricalPrice[] = [];
  const basePrice = 2000 + Math.random() * 1000;

  for (let i = days; i >= 0; i--) {
    const date = addDays(new Date(), -i);
    const volatility = (Math.random() - 0.5) * 200;
    const trend = Math.sin(i / 10) * 100;
    const price = basePrice + volatility + trend + Math.random() * 50;

    prices.push({
      date,
      price: Math.max(100, price),
      commodity,
      market,
    });
  }

  return prices;
}

/**
 * Calculate expected savings by buying from best supplier
 */
export function calculatePotentialSavings(
  commodity: string,
  quantity: number, // in quintals
  allPrices: CommodityPrice[]
): {
  maxPrice: number;
  minPrice: number;
  savingsPerQuintal: number;
  totalSavings: number;
} {
  const relevantPrices = allPrices.filter(
    (p) => p.commodityName.toLowerCase() === commodity.toLowerCase()
  );

  if (relevantPrices.length === 0) {
    return {
      maxPrice: 0,
      minPrice: 0,
      savingsPerQuintal: 0,
      totalSavings: 0,
    };
  }

  const priceValues = relevantPrices.map((p) => p.price);
  const maxPrice = Math.max(...priceValues);
  const minPrice = Math.min(...priceValues);
  const savingsPerQuintal = maxPrice - minPrice;
  const totalSavings = savingsPerQuintal * quantity;

  return {
    maxPrice,
    minPrice,
    savingsPerQuintal,
    totalSavings,
  };
}
