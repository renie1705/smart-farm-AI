import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  MapPin,
  Truck,
  BarChart3,
  RefreshCw,
  Bell,
  Target,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import { toast } from "sonner";
import {
  fetchAgMarkNetPrices,
  predict3DayPrices,
  generatePriceAlerts,
  findBestSuppliers,
  calculatePriceStats,
  getMarketTrends,
  getMockHistoricalPrices,
  calculatePotentialSavings,
  type CommodityPrice,
  type PricePrediction,
  type PriceAlert,
} from "@/lib/priceTracking";

interface TrackedCommodity {
  name: string;
  quantity: number;
  highPriceAlert: number;
  lowPriceAlert: number;
}

const PriceTracking = () => {
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [predictions, setPredictions] = useState<Map<string, PricePrediction[]>>(
    new Map()
  );
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [trackedCommodities, setTrackedCommodities] = useState<
    TrackedCommodity[]
  >([
    // Cereals
    { name: "Wheat", quantity: 100, highPriceAlert: 2200, lowPriceAlert: 2000 },
    { name: "Rice", quantity: 50, highPriceAlert: 2900, lowPriceAlert: 2700 },
    { name: "Maize", quantity: 60, highPriceAlert: 2050, lowPriceAlert: 1850 },
    { name: "Bajra", quantity: 40, highPriceAlert: 1950, lowPriceAlert: 1750 },
    { name: "Jowar", quantity: 50, highPriceAlert: 1850, lowPriceAlert: 1650 },
    { name: "Barley", quantity: 45, highPriceAlert: 1750, lowPriceAlert: 1550 },
    // Pulses
    { name: "Chickpea", quantity: 30, highPriceAlert: 5400, lowPriceAlert: 5100 },
    { name: "Lentil", quantity: 25, highPriceAlert: 6300, lowPriceAlert: 6000 },
    { name: "Moong", quantity: 20, highPriceAlert: 7050, lowPriceAlert: 6650 },
    { name: "Urad", quantity: 18, highPriceAlert: 7450, lowPriceAlert: 7050 },
    // Oilseeds
    { name: "Soybeans", quantity: 30, highPriceAlert: 4300, lowPriceAlert: 4000 },
    { name: "Groundnut", quantity: 25, highPriceAlert: 6050, lowPriceAlert: 5650 },
    { name: "Sunflower", quantity: 28, highPriceAlert: 6250, lowPriceAlert: 5850 },
    { name: "Mustard", quantity: 35, highPriceAlert: 5650, lowPriceAlert: 5250 },
    // Cash Crops
    { name: "Cotton", quantity: 20, highPriceAlert: 6300, lowPriceAlert: 6000 },
    { name: "Sugarcane", quantity: 200, highPriceAlert: 2900, lowPriceAlert: 2600 },
    // Vegetables
    { name: "Onions", quantity: 80, highPriceAlert: 1950, lowPriceAlert: 1700 },
    { name: "Potato", quantity: 150, highPriceAlert: 1300, lowPriceAlert: 1000 },
    { name: "Tomato", quantity: 120, highPriceAlert: 1600, lowPriceAlert: 1300 },
    { name: "Cabbage", quantity: 100, highPriceAlert: 900, lowPriceAlert: 700 },
    { name: "Cauliflower", quantity: 90, highPriceAlert: 1350, lowPriceAlert: 1050 },
    // Fruits
    { name: "Apple", quantity: 25, highPriceAlert: 4700, lowPriceAlert: 4300 },
    { name: "Banana", quantity: 40, highPriceAlert: 3400, lowPriceAlert: 3000 },
    { name: "Mango", quantity: 35, highPriceAlert: 3700, lowPriceAlert: 3300 },
    // Spices
    { name: "Turmeric", quantity: 15, highPriceAlert: 8050, lowPriceAlert: 7650 },
    { name: "Chili", quantity: 12, highPriceAlert: 8700, lowPriceAlert: 8300 },
    { name: "Cumin", quantity: 10, highPriceAlert: 11700, lowPriceAlert: 11300 },
    // Other crops
    { name: "Arhar", quantity: 22, highPriceAlert: 6450, lowPriceAlert: 6050 },
    { name: "Garlic", quantity: 18, highPriceAlert: 2950, lowPriceAlert: 2650 },
    { name: "Ginger", quantity: 20, highPriceAlert: 3700, lowPriceAlert: 3300 },
  ]);
  const [selectedCommodity, setSelectedCommodity] = useState<string>("Wheat");
  const [selectedState, setSelectedState] = useState<string>(""); // Empty = all states
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [statePrices, setStatePrices] = useState<Array<{state: string; market: string; price: number; minPrice: number; maxPrice: number; arrivalQuantity: number}>>([]);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);

  // Fetch prices on mount and set up refresh
  useEffect(() => {
    fetchPrices();
    
    if (isRealtimeEnabled) {
      const interval = setInterval(fetchPrices, 1000); // Refresh every second when enabled
      return () => clearInterval(interval);
    }
  }, [isRealtimeEnabled]);

  // Update state prices when selected commodity or state changes
  useEffect(() => {
    let selectedPrices = prices
      .filter(p => p.commodityName === selectedCommodity);
    
    // Filter by state if selected
    if (selectedState) {
      selectedPrices = selectedPrices.filter(p => p.state === selectedState);
    }
    
    selectedPrices = selectedPrices.sort((a, b) => a.price - b.price); // Sort by price (lowest first)
    setStatePrices(selectedPrices);
  }, [selectedCommodity, selectedState, prices]);

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      // Fetch prices for all states
      const allStates = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Delhi", "Puducherry"
      ];
      
      const data = await fetchAgMarkNetPrices(
        trackedCommodities.map((c) => c.name),
        allStates
      );
      setPrices(data);
      
      // Filter prices for currently selected commodity and organize by state
      const selectedPrices = data
        .filter(p => p.commodityName === selectedCommodity)
        .sort((a, b) => a.price - b.price); // Sort by price (lowest first)
      
      setStatePrices(selectedPrices);
      setLastUpdated(new Date());

      // Generate predictions for each commodity-market combination
      const predictionsMap = new Map<string, PricePrediction[]>();
      for (const commodity of trackedCommodities) {
        for (const priceEntry of data) {
          if (priceEntry.commodityName === commodity.name) {
            const key = `${commodity.name}-${priceEntry.market}`;
            const historicalData = getMockHistoricalPrices(commodity.name, priceEntry.market);
            const pred = predict3DayPrices(historicalData);
            predictionsMap.set(key, pred);
          }
        }
      }
      setPredictions(predictionsMap);

      // Generate alerts - set thresholds for each commodity-market combination
      const thresholds = new Map<string, { highPrice: number; lowPrice: number }>();
      for (const commodity of trackedCommodities) {
        // Set threshold for each price entry (commodity + market combination)
        for (const priceEntry of data) {
          if (priceEntry.commodityName === commodity.name) {
            const key = `${commodity.name}-${priceEntry.market}`;
            thresholds.set(key, {
              highPrice: commodity.highPriceAlert,
              lowPrice: commodity.lowPriceAlert,
            });
          }
        }
      }
      const newAlerts = generatePriceAlerts(data, predictionsMap, thresholds);
      setAlerts(newAlerts);

      toast.success("✅ Prices updated for all states");
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast.error("Failed to fetch prices");
    } finally {
      setIsLoading(false);
    }
  };

  const currentPrices = prices.filter(
    (p) => p.commodityName.toLowerCase() === selectedCommodity.toLowerCase()
  );
  
  // Get predictions for the selected commodity - aggregate from all markets
  const currentPredictions = (() => {
    const predsByDate = new Map<string, { predicted: number; confidence: number; trend: string; change: number }>();
    
    // Collect predictions from all markets for this commodity
    for (const [key, preds] of predictions.entries()) {
      if (key.startsWith(selectedCommodity)) {
        preds.forEach((pred, idx) => {
          const dateKey = pred.date.toISOString().split('T')[0];
          if (!predsByDate.has(dateKey)) {
            predsByDate.set(dateKey, { predicted: pred.predictedPrice, confidence: pred.confidence, trend: pred.trend, change: pred.priceChange });
          } else {
            // Average multiple market predictions
            const existing = predsByDate.get(dateKey)!;
            existing.predicted = (existing.predicted + pred.predictedPrice) / 2;
            existing.confidence = (existing.confidence + pred.confidence) / 2;
          }
        });
      }
    }
    
    // Convert back to array format expected by component
    return Array.from(predsByDate.entries()).slice(0, 3).map(([date, data]) => ({
      date: new Date(date),
      predictedPrice: data.predicted,
      confidence: data.confidence,
      trend: data.trend as "up" | "down" | "stable",
      priceChange: data.change
    }));
  })();
  const commodityAlerts = alerts.filter(
    (a) => a.commodityName.toLowerCase() === selectedCommodity.toLowerCase()
  );

  const bestSuppliers = findBestSuppliers(prices, selectedCommodity, 3);
  const stats = calculatePriceStats(prices);
  const trends = getMarketTrends(prices, selectedCommodity);
  const trackedItem = trackedCommodities.find(
    (c) => c.name === selectedCommodity
  );
  const savings = trackedItem
    ? calculatePotentialSavings(selectedCommodity, trackedItem.quantity, prices)
    : null;

  // Prepare chart data
  const priceComparison = currentPrices.map((p) => ({
    market: p.market,
    price: p.price,
    min: p.minPrice,
    max: p.maxPrice,
  }));

  const predictionChartData = currentPredictions.map((p) => ({
    date: p.date.toLocaleDateString(),
    predicted: Math.round(p.predictedPrice),
    confidence: Math.round(p.confidence * 100),
    trend: p.trend,
  }));

  const marketTrendsData = Array.from(trends.entries()).map(([state, price]) => ({
    state,
    price,
  }));

  const highAlerts = alerts.filter((a) => a.alertType === "high");
  const lowAlerts = alerts.filter((a) => a.alertType === "best_deal");

  // Download functions
  const downloadAsCSV = () => {
    // Create multiple sheets worth of data
    const sheets = [];

    // Sheet 1: Current Prices
    sheets.push("=== CURRENT PRICES ===");
    sheets.push(["Rank", "State", "Market", "Price (₹/q)", "Min Price", "Max Price", "Arrival (q)"].join(","));
    statePrices.forEach((p, idx) => {
      sheets.push([idx + 1, p.state, p.market, p.price.toFixed(0), p.minPrice, p.maxPrice, p.arrivalQuantity].map(v => `"${v}"`).join(","));
    });

    sheets.push(""); // Empty line
    sheets.push("=== PRICE SUMMARY ===");
    sheets.push(["Metric", "Value"].join(","));
    sheets.push(["Lowest Price", statePrices.length > 0 ? statePrices[0].price.toFixed(0) : "N/A"].map(v => `"${v}"`).join(","));
    sheets.push(["Highest Price", statePrices.length > 0 ? Math.max(...statePrices.map(p => p.price)).toFixed(0) : "N/A"].map(v => `"${v}"`).join(","));
    sheets.push(["Average Price", statePrices.length > 0 ? (statePrices.reduce((sum, p) => sum + p.price, 0) / statePrices.length).toFixed(0) : "N/A"].map(v => `"${v}"`).join(","));
    sheets.push(["Total Markets", statePrices.length].map(v => `"${v}"`).join(","));

    sheets.push(""); // Empty line
    sheets.push("=== 3-DAY PRICE FORECAST ===");
    sheets.push(["Date", "Predicted Price (₹/q)", "Confidence (%)", "Trend", "Price Change"].join(","));
    currentPredictions.forEach((p) => {
      sheets.push([
        p.date.toLocaleDateString(),
        p.predictedPrice.toFixed(0),
        (p.confidence * 100).toFixed(0),
        p.trend,
        p.priceChange.toFixed(0)
      ].map(v => `"${v}"`).join(","));
    });

    sheets.push(""); // Empty line
    sheets.push("=== PRICE ALERTS ===");
    sheets.push(["Alert Type", "Commodity", "Market", "Current Price", "Message", "Severity", "Time"].join(","));
    commodityAlerts.forEach((alert) => {
      sheets.push([
        alert.alertType,
        alert.commodityName,
        alert.market,
        alert.currentPrice.toFixed(0),
        alert.message,
        alert.severity,
        alert.timestamp.toLocaleTimeString()
      ].map(v => `"${v}"`).join(","));
    });

    sheets.push(""); // Empty line
    sheets.push("=== BEST SUPPLIERS ===");
    sheets.push(["Rank", "Market", "State", "Price (₹/q)", "Min Price", "Max Price", "Arrival (q)", "Date"].join(","));
    bestSuppliers.forEach((supplier, idx) => {
      sheets.push([
        idx + 1,
        supplier.market,
        supplier.state,
        supplier.price.toFixed(0),
        supplier.minPrice,
        supplier.maxPrice,
        supplier.arrivalQuantity,
        supplier.date.toLocaleDateString()
      ].map(v => `"${v}"`).join(","));
    });

    sheets.push(""); // Empty line
    sheets.push("=== MARKET TRENDS ===");
    sheets.push(["State/Market", "Average Price (₹/q)"].join(","));
    Array.from(trends.entries()).forEach(([state, price]) => {
      sheets.push([state, price.toFixed(0)].map(v => `"${v}"`).join(","));
    });

    sheets.push(""); // Empty line
    sheets.push("=== EXPORT INFO ===");
    sheets.push(["Commodity", selectedCommodity].map(v => `"${v}"`).join(","));
    sheets.push(["State Filter", selectedState || "All States"].map(v => `"${v}"`).join(","));
    sheets.push(["Generated At", new Date().toISOString()].map(v => `"${v}"`).join(","));

    const csvContent = sheets.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCommodity}_complete_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("✅ Complete CSV report downloaded successfully");
  };

  const downloadAsJSON = () => {
    const jsonData = {
      metadata: {
        commodity: selectedCommodity,
        stateFilter: selectedState || "All States",
        generatedAt: new Date().toISOString(),
        totalMarkets: statePrices.length,
        totalAlerts: commodityAlerts.length,
      },
      currentPrices: statePrices.map((p, idx) => ({
        rank: idx + 1,
        state: p.state,
        market: p.market,
        price: p.price,
        priceRange: { min: p.minPrice, max: p.maxPrice },
        arrivalQuantity: p.arrivalQuantity,
      })),
      priceSummary: {
        lowestPrice: statePrices.length > 0 ? statePrices[0].price : 0,
        lowestMarket: statePrices.length > 0 ? `${statePrices[0].market}, ${statePrices[0].state}` : "N/A",
        highestPrice: statePrices.length > 0 ? Math.max(...statePrices.map((p) => p.price)) : 0,
        averagePrice: statePrices.length > 0 ? (statePrices.reduce((sum, p) => sum + p.price, 0) / statePrices.length).toFixed(0) : 0,
      },
      predictions: currentPredictions.map((p) => ({
        date: p.date.toISOString(),
        predictedPrice: p.predictedPrice.toFixed(0),
        confidence: (p.confidence * 100).toFixed(2) + "%",
        trend: p.trend,
        priceChange: p.priceChange.toFixed(0),
      })),
      alerts: {
        total: commodityAlerts.length,
        highPriority: commodityAlerts.filter((a) => a.severity === "high").length,
        details: commodityAlerts.map((a) => ({
          type: a.alertType,
          commodity: a.commodityName,
          market: a.market,
          currentPrice: a.currentPrice,
          message: a.message,
          severity: a.severity,
          timestamp: a.timestamp.toISOString(),
        })),
      },
      bestSuppliers: bestSuppliers.map((s, idx) => ({
        rank: idx + 1,
        market: s.market,
        state: s.state,
        price: s.price,
        priceRange: { min: s.minPrice, max: s.maxPrice },
        arrivalQuantity: s.arrivalQuantity,
        date: s.date.toISOString(),
      })),
      marketTrends: Array.from(trends.entries()).map(([state, price]) => ({
        state,
        averagePrice: price.toFixed(0),
      })),
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCommodity}_complete_report_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("✅ Complete JSON report downloaded successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navigation />
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-2 sm:gap-3 flex-wrap">
            <DollarSign className="h-7 sm:h-8 md:h-10 w-7 sm:w-8 md:w-10 text-primary flex-shrink-0" />
            <span>Price Tracking</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
            Real-time commodity prices with AI predictions
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-2">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Alerts Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Price Alerts
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">{highAlerts.length}</p>
                </div>
                <AlertTriangle className="h-10 sm:h-12 w-10 sm:w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Best Deals
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{lowAlerts.length}</p>
                </div>
                <CheckCircle className="h-10 sm:h-12 w-10 sm:w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commodity Selection & Control */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground">Monitor Commodities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {trackedCommodities.map((commodity) => (
                <Badge
                  key={commodity.name}
                  onClick={() => setSelectedCommodity(commodity.name)}
                  className={`cursor-pointer px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm ${
                    selectedCommodity === commodity.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {commodity.name}
                </Badge>
              ))}
            </div>

            <div className="mt-3 p-3 sm:p-4 border border-muted rounded-lg bg-muted/30">
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Filter by State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All States (Showing {statePrices.length} markets)</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                <option value="Assam">Assam</option>
                <option value="Bihar">Bihar</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Goa">Goa</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Haryana">Haryana</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Manipur">Manipur</option>
                <option value="Meghalaya">Meghalaya</option>
                <option value="Mizoram">Mizoram</option>
                <option value="Nagaland">Nagaland</option>
                <option value="Odisha">Odisha</option>
                <option value="Punjab">Punjab</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Sikkim">Sikkim</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Telangana">Telangana</option>
                <option value="Tripura">Tripura</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Delhi">Delhi</option>
                <option value="Puducherry">Puducherry</option>
              </select>
            </div>
            
            <Button
              onClick={fetchPrices}
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground text-xs sm:text-sm"
            >
              <RefreshCw className={`h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Updating..." : "Refresh"}
            </Button>

            {/* Download Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={downloadAsCSV}
                disabled={statePrices.length === 0}
                variant="outline"
                className="flex-1 text-xs sm:text-sm"
              >
                <Download className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                CSV
              </Button>
              <Button
                onClick={downloadAsJSON}
                disabled={statePrices.length === 0}
                variant="outline"
                className="flex-1 text-xs sm:text-sm"
              >
                <Download className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                JSON
              </Button>
            </div>

            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-muted bg-muted/50 mt-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full flex-shrink-0 ${isRealtimeEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                <span className="text-xs sm:text-sm font-medium text-foreground truncate">Real-time</span>
              </div>
              <Button
                onClick={() => setIsRealtimeEnabled(!isRealtimeEnabled)}
                size="sm"
                className={`text-xs ml-1 sm:ml-2 ${isRealtimeEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}`}
              >
                {isRealtimeEnabled ? "ON" : "OFF"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Savings Analysis */}
        {savings && savings.totalSavings > 0 && (
          <Card className="mb-6 sm:mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base text-foreground flex items-center gap-2">
                <Target className="h-4 sm:h-5 w-4 sm:w-5 text-green-600 flex-shrink-0" />
                <span>Potential Savings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Highest</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">₹{savings.maxPrice.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">₹{savings.minPrice.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Per Q</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">₹{savings.savingsPerQuintal.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Save</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{savings.totalSavings.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Tabs */}
        <Tabs defaultValue="prices" className="mb-6 sm:mb-8">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 bg-muted p-1 sm:p-2">
            <TabsTrigger value="prices" className="text-xs sm:text-sm">Prices</TabsTrigger>
            <TabsTrigger value="prediction" className="text-xs sm:text-sm">Forecast</TabsTrigger>
            <TabsTrigger value="suppliers" className="text-xs sm:text-sm hidden sm:inline-flex">Suppliers</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm hidden sm:inline-flex">Trends</TabsTrigger>
          </TabsList>

          {/* Current Prices Tab */}
          <TabsContent value="prices">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">{selectedCommodity} Prices</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentPrices.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={priceComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="market" angle={-30} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="price" fill="#3b82f6" name="Current" />
                        <Bar dataKey="min" fill="#10b981" name="Min" />
                        <Bar dataKey="max" fill="#ef4444" name="Max" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left">Market</th>
                            <th className="px-4 py-2 text-left">State</th>
                            <th className="px-4 py-2 text-right">Price (₹/q)</th>
                            <th className="px-4 py-2 text-right">Range</th>
                            <th className="px-4 py-2 text-right">Arrival (q)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPrices.map((price) => (
                            <tr key={price.id} className="border-b border-muted hover:bg-muted/50">
                              <td className="px-4 py-2 font-medium">{price.market}</td>
                              <td className="px-4 py-2">{price.state}</td>
                              <td className="px-4 py-2 text-right font-bold text-primary">
                                ₹{price.price.toFixed(0)}
                              </td>
                              <td className="px-4 py-2 text-right text-sm text-muted-foreground">
                                ₹{price.minPrice}-{price.maxPrice}
                              </td>
                              <td className="px-4 py-2 text-right">{price.arrivalQuantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3-Day Prediction Tab */}
          <TabsContent value="prediction">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  3-Day Price Forecast (AI Powered)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentPredictions.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={predictionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Predicted"
                          dot={{ fill: "#3b82f6" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="confidence"
                          stroke="#94a3b8"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          name="Confidence"
                        />
                      </LineChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                      {currentPredictions.map((pred, idx) => (
                        <Card
                          key={idx}
                          className={`border-2 ${
                            pred.trend === "up"
                              ? "border-orange-200 bg-orange-50 dark:bg-orange-950"
                              : pred.trend === "down"
                              ? "border-green-200 bg-green-50 dark:bg-green-950"
                              : "border-blue-200 bg-blue-50 dark:bg-blue-950"
                          }`}
                        >
                          <CardContent className="pt-3">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                              {pred.date.toLocaleDateString()}
                            </p>
                            <p className="text-lg sm:text-2xl font-bold text-foreground">
                              ₹{pred.predictedPrice.toFixed(0)}
                            </p>
                            <div className="flex items-center justify-between mt-2 sm:mt-3">
                              <div className="flex items-center gap-1 sm:gap-2">
                                {pred.trend === "up" ? (
                                  <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 text-orange-600" />
                                ) : pred.trend === "down" ? (
                                  <TrendingDown className="h-3 sm:h-4 w-3 sm:w-4 text-green-600" />
                                ) : (
                                  <div className="h-3 sm:h-4 w-3 sm:w-4 text-blue-600">→</div>
                                )}
                                <span className="text-xs sm:text-sm font-semibold">
                                  {pred.priceChange > 0 ? "+" : ""}
                                  ₹{pred.priceChange.toFixed(0)}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {Math.round(pred.confidence * 100)}%
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No prediction data available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Best Suppliers Tab */}
          <TabsContent value="suppliers">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base text-foreground flex items-center gap-2">
                  <Truck className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Best Suppliers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bestSuppliers.length > 0 ? (
                  <div className="space-y-4">
                    {bestSuppliers.map((supplier, idx) => (
                      <div
                        key={supplier.id}
                        className={`p-4 rounded-lg border-2 ${
                          idx === 0
                            ? "border-green-200 bg-green-50 dark:bg-green-950"
                            : idx === 1
                            ? "border-blue-200 bg-blue-50 dark:bg-blue-950"
                            : "border-orange-200 bg-orange-50 dark:bg-orange-950"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-base sm:text-lg text-foreground">
                                #{idx + 1}
                              </p>
                              {idx === 0 && (
                                <Badge className="bg-green-600 text-xs">Top</Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                              <MapPin className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{supplier.market}</span>
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xl sm:text-3xl font-bold text-primary">
                              ₹{supplier.price}
                            </p>
                            <p className="text-xs text-muted-foreground">per q</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-muted-foreground">Min</p>
                            <p className="font-semibold">₹{supplier.minPrice}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Max</p>
                            <p className="font-semibold">₹{supplier.maxPrice}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Qty</p>
                            <p className="font-semibold">{supplier.arrivalQuantity}q</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-semibold text-xs">{supplier.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>

                        {trackedItem && (
                          <Button className="w-full mt-2 sm:mt-4 bg-primary text-primary-foreground text-xs sm:text-sm py-1 sm:py-2">
                            Order {trackedItem.quantity}q (~₹
                            {(supplier.price * trackedItem.quantity).toLocaleString()})
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No supplier data available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Trends Tab */}
          <TabsContent value="trends" className="hidden sm:block">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">State Comparison</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {marketTrendsData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={marketTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="state" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="price" fill="#3b82f6" name="Price (₹/q)" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-4">
                      <h3 className="font-semibold text-sm mb-3">Analysis</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200">
                          <p className="text-xs text-muted-foreground">Cheapest</p>
                          <p className="font-bold text-sm text-foreground">
                            {Array.from(trends.entries()).sort((a, b) => a[1] - b[1])[0]?.[0]} - ₹
                            {Array.from(trends.entries())
                              .sort((a, b) => a[1] - b[1])[0]?.[1]
                              .toFixed(0)}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200">
                          <p className="text-xs text-muted-foreground">Most Expensive</p>
                          <p className="font-bold text-foreground">
                            {Array.from(trends.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]} -
                            ₹
                            {Array.from(trends.entries())
                              .sort((a, b) => b[1] - a[1])[0]?.[1]
                              .toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No trend data available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* State-wise Real-time Price Display */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Real-time Prices across India - {selectedCommodity}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Showing {statePrices.length} markets | Lowest: ₹{statePrices.length > 0 ? statePrices[0].price : 0}/q | Highest: ₹{statePrices.length > 0 ? Math.max(...statePrices.map(p => p.price)) : 0}/q
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">Rank</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold hidden sm:table-cell">State</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">Market</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold">Price</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold hidden md:table-cell">Range</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold hidden lg:table-cell">Arrival</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statePrices.map((price, idx) => {
                    const savings = idx === 0 ? 0 : (statePrices[0].price - price.price) * (trackedItem?.quantity || 0);
                    const status = idx === 0 ? "best" : idx < 3 ? "good" : idx < 10 ? "fair" : "high";
                    
                    return (
                      <tr key={price.state + price.market} className={`border-b border-muted transition-colors ${
                        idx === 0 
                          ? "bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50"
                          : status === "good"
                          ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50"
                          : "hover:bg-muted/50"
                      }`}>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-primary text-xs sm:text-sm">#{idx + 1}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium hidden sm:table-cell text-xs">{price.state}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground text-xs sm:text-sm">{price.market}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-base sm:text-lg">
                          <span className={idx === 0 ? "text-green-600" : "text-foreground"}>
                            ₹{price.price.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs text-muted-foreground hidden md:table-cell">
                          ₹{price.minPrice}-{price.maxPrice}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs hidden lg:table-cell">{price.arrivalQuantity.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          {idx === 0 ? (
                            <Badge className="bg-green-600 text-xs">Best</Badge>
                          ) : status === "good" ? (
                            <Badge className="bg-blue-600 text-xs">Good</Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">High</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Price Analysis Summary */}
            {statePrices.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-muted">
                <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200">
                  <p className="text-xs text-muted-foreground mb-1">Lowest</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">₹{statePrices[0].price.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{statePrices[0].market}</p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200">
                  <p className="text-xs text-muted-foreground mb-1">Highest</p>
                  <p className="text-lg sm:text-xl font-bold text-orange-600">₹{Math.max(...statePrices.map(p => p.price)).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {statePrices.reduce((max, p) => p.price > max.price ? p : max).market}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
                  <p className="text-xs text-muted-foreground mb-1">Average</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">
                    ₹{(statePrices.reduce((sum, p) => sum + p.price, 0) / statePrices.length).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{statePrices.length}M</p>
                </div>
                {trackedItem && (
                  <div className="p-2 sm:p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200">
                    <p className="text-xs text-muted-foreground mb-1">Max Save</p>
                    <p className="text-lg sm:text-xl font-bold text-purple-600">
                      ₹{((Math.max(...statePrices.map(p => p.price)) - statePrices[0].price) * trackedItem.quantity).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{trackedItem.quantity}q</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Alerts Section */}
        {commodityAlerts.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Active Alerts for {selectedCommodity}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {commodityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 flex items-start gap-3 ${
                      alert.severity === "high"
                        ? "bg-red-50 dark:bg-red-950 border-red-500"
                        : alert.severity === "medium"
                        ? "bg-orange-50 dark:bg-orange-950 border-orange-500"
                        : "bg-blue-50 dark:bg-blue-950 border-blue-500"
                    }`}
                  >
                    {alert.alertType === "best_deal" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PriceTracking;
