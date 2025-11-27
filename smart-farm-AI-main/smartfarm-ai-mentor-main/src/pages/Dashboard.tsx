import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Sun, ThermometerSun, MapPin, Loader2, TrendingUp, Radio, TrendingDown, Globe, IndianRupee, ShoppingCart, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import heroImage from "@/assets/farm-hero.jpg";
import { getWeatherData } from "@/lib/gemini";
import { fetchEnamTradeData, type EnamTradeData } from "@/lib/enamApi";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";

interface LiveDataPoint {
  time: string;
  temperature: number;
  humidity: number;
}

const Dashboard = () => {
  const [location, setLocation] = useState("Coimbatore, India");
  const [loading, setLoading] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [liveData, setLiveData] = useState<LiveDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [indiaCropSales, setIndiaCropSales] = useState([
    { crop: "Rice", sales: 185000, change: 2.5 },
    { crop: "Wheat", sales: 142000, change: 1.8 },
    { crop: "Sugarcane", sales: 125000, change: 3.2 },
    { crop: "Cotton", sales: 98000, change: -0.5 },
    { crop: "Maize", sales: 87000, change: 4.1 },
    { crop: "Soybean", sales: 76000, change: 2.3 },
  ]);
  const [worldCropSales, setWorldCropSales] = useState([
    { crop: "Rice", sales: 2850000, change: 1.8 },
    { crop: "Wheat", sales: 2650000, change: 2.1 },
    { crop: "Corn", sales: 2450000, change: 3.5 },
    { crop: "Soybean", sales: 1850000, change: 2.8 },
    { crop: "Potato", sales: 1650000, change: 1.2 },
    { crop: "Tomato", sales: 1250000, change: 4.2 },
  ]);
  const [weatherData, setWeatherData] = useState({
    temperature: 29,
    humidity: 68,
    rainfall: 35,
    sunshine: 9,
    description: "pleasant and partly cloudy",
  });

  const [soilData, setSoilData] = useState({
    ph: 6.5,
    nitrogen: 85,
    phosphorus: 60,
    potassium: 80,
  });
  const [marketPrices, setMarketPrices] = useState<EnamTradeData[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Array<{ time: string; data: EnamTradeData[]; state: string }>>([]);
  const marketIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedState, setSelectedState] = useState<string>("All");

  // List of Indian states for e-NAM
  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Puducherry",
  ];

  // Generate sample data for visualizations
  const weatherTrendData = [
    { month: "Jan", temperature: 22, humidity: 60, rainfall: 20 },
    { month: "Feb", temperature: 24, humidity: 58, rainfall: 15 },
    { month: "Mar", temperature: 26, humidity: 62, rainfall: 25 },
    { month: "Apr", temperature: 28, humidity: 65, rainfall: 30 },
    { month: "May", temperature: 30, humidity: 68, rainfall: 45 },
    { month: "Jun", temperature: 29, humidity: 70, rainfall: 120 },
    { month: "Jul", temperature: 28, humidity: 72, rainfall: 180 },
    { month: "Aug", temperature: 27, humidity: 71, rainfall: 160 },
    { month: "Sep", temperature: 27, humidity: 69, rainfall: 100 },
    { month: "Oct", temperature: 26, humidity: 66, rainfall: 50 },
    { month: "Nov", temperature: 24, humidity: 63, rainfall: 30 },
    { month: "Dec", temperature: 23, humidity: 61, rainfall: 25 },
  ];

  // Real-time data generation
  const generateLiveDataPoint = useCallback(() => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Simulate realistic variations
    const tempVariation = (Math.random() - 0.5) * 2; // ±1°C
    const humidityVariation = (Math.random() - 0.5) * 4; // ±2%
    
    return {
      time,
      temperature: Math.round((weatherData.temperature + tempVariation) * 10) / 10,
      humidity: Math.round((weatherData.humidity + humidityVariation) * 10) / 10,
    };
  }, [weatherData.temperature, weatherData.humidity]);

  // Update live data stream
  useEffect(() => {
    if (realTimeEnabled) {
      // Initialize with current data
      const initialData = Array.from({ length: 20 }, (_, i) => {
        const time = new Date(Date.now() - (19 - i) * 30000); // Last 20 points, 30s apart
        return {
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temperature: weatherData.temperature + (Math.random() - 0.5) * 2,
          humidity: weatherData.humidity + (Math.random() - 0.5) * 4,
        };
      });
      setLiveData(initialData);

      // Update every 5 seconds
      intervalRef.current = setInterval(() => {
        setLiveData((prev) => {
          const newData = [...prev, generateLiveDataPoint()];
          // Keep only last 30 data points
          return newData.slice(-30);
        });
        setLastUpdate(new Date());
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [realTimeEnabled, generateLiveDataPoint, weatherData]);

  const soilHealthData = [
    { nutrient: "Nitrogen", value: soilData.nitrogen, optimal: 70, color: "hsl(142, 76%, 36%)" },
    { nutrient: "Phosphorus", value: soilData.phosphorus, optimal: 70, color: "hsl(40, 95%, 55%)" },
    { nutrient: "Potassium", value: soilData.potassium, optimal: 70, color: "hsl(200, 80%, 55%)" },
  ];

  // Simulate real-time soil data updates
  useEffect(() => {
    if (realTimeEnabled) {
      const soilInterval = setInterval(() => {
        setSoilData((prev) => ({
          ...prev,
          nitrogen: Math.max(70, Math.min(95, prev.nitrogen + (Math.random() - 0.5) * 2)),
          phosphorus: Math.max(50, Math.min(80, prev.phosphorus + (Math.random() - 0.5) * 2)),
          potassium: Math.max(70, Math.min(90, prev.potassium + (Math.random() - 0.5) * 2)),
        }));
      }, 10000); // Update every 10 seconds

      return () => clearInterval(soilInterval);
    }
  }, [realTimeEnabled]);

  // Simulate real-time crop sales updates
  useEffect(() => {
    if (realTimeEnabled) {
      const salesInterval = setInterval(() => {
        // Update India crop sales with realistic variations
        setIndiaCropSales((prev) =>
          prev.map((crop) => ({
            ...crop,
            sales: Math.max(50000, crop.sales + (Math.random() - 0.5) * 5000),
            change: Math.max(-5, Math.min(10, crop.change + (Math.random() - 0.5) * 0.5)),
          }))
        );

        // Update World crop sales with realistic variations
        setWorldCropSales((prev) =>
          prev.map((crop) => ({
            ...crop,
            sales: Math.max(1000000, crop.sales + (Math.random() - 0.5) * 50000),
            change: Math.max(-3, Math.min(8, crop.change + (Math.random() - 0.5) * 0.3)),
          }))
        );
      }, 8000); // Update every 8 seconds

      return () => clearInterval(salesInterval);
    }
  }, [realTimeEnabled]);

  const monthlyRainfallData = weatherTrendData.map(item => ({
    month: item.month,
    rainfall: item.rainfall,
  }));

  const chartConfig = {
    temperature: {
      label: "Temperature",
      color: "hsl(40, 95%, 55%)",
    },
    humidity: {
      label: "Humidity",
      color: "hsl(200, 80%, 55%)",
    },
    rainfall: {
      label: "Rainfall",
      color: "hsl(200, 80%, 55%)",
    },
    nitrogen: {
      label: "Nitrogen",
      color: "hsl(142, 76%, 36%)",
    },
    phosphorus: {
      label: "Phosphorus",
      color: "hsl(40, 95%, 55%)",
    },
    potassium: {
      label: "Potassium",
      color: "hsl(200, 80%, 55%)",
    },
    sales: {
      label: "Sales",
      color: "hsl(142, 76%, 36%)",
    },
  };

  const COLORS = [
    "hsl(142, 76%, 36%)",
    "hsl(40, 95%, 55%)",
    "hsl(200, 80%, 55%)",
    "hsl(30, 35%, 50%)",
    "hsl(0, 84%, 60%)",
    "hsl(280, 70%, 50%)",
  ];

  const fetchWeather = async (loc: string) => {
    setLoading(true);
    try {
      const data = await getWeatherData(loc);

      setWeatherData({
        temperature: data.temperature,
        humidity: data.humidity,
        rainfall: data.rainfall,
        sunshine: data.sunshine,
        description: data.description,
      });
      toast.success(`Weather data updated for ${data.location || loc}`);
    } catch (error: unknown) {
      console.error("Weather fetch error:", error);
      
      // Use fallback data when API is not available
      const fallbackData = {
        temperature: 28,
        humidity: 65,
        rainfall: 45,
        sunshine: 8,
        description: "partly cloudy",
      };
      
      setWeatherData(fallbackData);
      toast.warning("Using sample weather data. Please check your Gemini API key.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(location);
  }, [location]);

  const fetchMarketPrices = useCallback(async (showToast = true) => {
    setMarketLoading(true);
    try {
      // Use selected state (handle "All" option)
      const state = selectedState === "All" ? undefined : selectedState;
      const data = await fetchEnamTradeData({ state });
      setMarketPrices(data);
      
      // Add to price history for trend visualization
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setPriceHistory((prev) => {
        // Clear history if state changed
        const lastState = prev.length > 0 ? prev[prev.length - 1].state : null;
        const currentState = state || "All";
        const newHistory = lastState === currentState 
          ? [...prev, { time, data, state: currentState }]
          : [{ time, data, state: currentState }];
        // Keep only last 20 data points
        return newHistory.slice(-20);
      });
      
      if (showToast) {
        toast.success(`Market prices updated for ${selectedState === "All" ? "All States" : selectedState}`);
      }
    } catch (error) {
      console.error("Error fetching market prices:", error);
      if (showToast) {
        toast.warning("Using sample market data");
      }
    } finally {
      setMarketLoading(false);
    }
  }, [selectedState]);

  useEffect(() => {
    fetchMarketPrices();
  }, [fetchMarketPrices]);

  // Auto-refresh weather data when real-time is enabled
  useEffect(() => {
    if (realTimeEnabled) {
      const weatherInterval = setInterval(() => {
        fetchWeather(location);
      }, 60000); // Refresh every 60 seconds

      return () => clearInterval(weatherInterval);
    }
  }, [realTimeEnabled, location]);

  // Auto-refresh market prices when real-time is enabled
  useEffect(() => {
    if (realTimeEnabled) {
      // Initial fetch
      fetchMarketPrices(false);
      
      // Set up interval for auto-refresh (every 2 minutes for market data)
      marketIntervalRef.current = setInterval(() => {
        fetchMarketPrices(false);
      }, 120000); // Refresh every 2 minutes

      return () => {
        if (marketIntervalRef.current) {
          clearInterval(marketIntervalRef.current);
          marketIntervalRef.current = null;
        }
      };
    } else {
      if (marketIntervalRef.current) {
        clearInterval(marketIntervalRef.current);
        marketIntervalRef.current = null;
      }
    }
  }, [realTimeEnabled, fetchMarketPrices]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Smart farming technology" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/60" />
        </div>
        
        <div className="relative container h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">
            Welcome to <span className="text-primary">SmartFarm AI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            AI-powered insights for smarter farming decisions. Predict optimal crops, 
            detect plant diseases, and maximize your harvest potential.
          </p>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="container py-12">
        {/* Real-time Control Panel */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse shrink-0" />
                <span>Real-Time Monitoring</span>
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {realTimeEnabled && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                    <span>Live</span>
                    <span className="text-xs hidden sm:inline">Last update: {lastUpdate.toLocaleTimeString()}</span>
                    <span className="text-xs sm:hidden">{lastUpdate.toLocaleTimeString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Label htmlFor="realtime-toggle" className="cursor-pointer text-sm">
                    {realTimeEnabled ? "Enabled" : "Disabled"}
                  </Label>
                  <Switch
                    id="realtime-toggle"
                    checked={realTimeEnabled}
                    onCheckedChange={setRealTimeEnabled}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Location Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <span>Your Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city name"
                className="flex-1"
              />
              <Button 
                onClick={() => fetchWeather(location)} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update"
                )}
              </Button>
            </div>
            {weatherData.description && (
              <p className="text-sm text-muted-foreground mt-2 capitalize truncate">
                Current: {weatherData.description}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-12">
          <Card className="border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
                Temperature
              </CardTitle>
              <ThermometerSun className="h-4 w-4 text-accent shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-accent">{weatherData.temperature}°C</div>
              <p className="text-xs text-muted-foreground mt-1 truncate">Current reading</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
                Humidity
              </CardTitle>
              <Droplets className="h-4 w-4 text-primary shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{weatherData.humidity}%</div>
              <p className="text-xs text-muted-foreground mt-1 truncate">Optimal range</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
                Rainfall
              </CardTitle>
              <Cloud className="h-4 w-4 text-accent shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-accent">{weatherData.rainfall}mm</div>
              <p className="text-xs text-muted-foreground mt-1 truncate">This month</p>
            </CardContent>
          </Card>

          <Card className="border-harvest/20 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
                Sunshine Hours
              </CardTitle>
              <Sun className="h-4 w-4 text-harvest shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-harvest">{weatherData.sunshine}hrs</div>
              <p className="text-xs text-muted-foreground mt-1 truncate">Daily average</p>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Live Data Chart */}
        {realTimeEnabled && liveData.length > 0 && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse shrink-0" />
                <span className="truncate">Live Weather Monitoring (Last 10 Minutes)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <LineChart data={liveData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="time" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval="preserveStartEnd"
                    fontSize={10}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={50}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="var(--color-temperature)" 
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="var(--color-humidity)" 
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Visualizations Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Weather Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="truncate">Weather Trends (12 Months)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <LineChart data={weatherTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={50}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="var(--color-temperature)" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="var(--color-humidity)" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Monthly Rainfall Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Cloud className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0" />
                <span className="truncate">Monthly Rainfall (mm)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={monthlyRainfallData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={50}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="rainfall" 
                    fill="var(--color-rainfall)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Soil Health */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Soil Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Soil Health Chart */}
              <div className="w-full">
                <ChartContainer config={chartConfig} className="h-[220px] sm:h-[240px] w-full">
                  <BarChart data={soilHealthData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis 
                      dataKey="nutrient" 
                      type="category" 
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      fontSize={10}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                    >
                      {soilHealthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Soil Health Metrics */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">pH Level</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{soilData.ph}</p>
                  <p className="text-xs text-muted-foreground truncate">Slightly acidic - Ideal</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Nitrogen (N)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent">{Math.round(soilData.nitrogen)}%</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {soilData.nitrogen >= 70 ? "Good for leafy crops" : "Needs improvement"}
                    {realTimeEnabled && <span className="ml-2 text-green-500">●</span>}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Phosphorus (P)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-harvest">{Math.round(soilData.phosphorus)}%</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {soilData.phosphorus >= 70 ? "Supports root growth" : "Below optimal"}
                    {realTimeEnabled && <span className="ml-2 text-green-500">●</span>}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Potassium (K)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{Math.round(soilData.potassium)}%</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {soilData.potassium >= 70 ? "Enhances disease resistance" : "Adequate"}
                    {realTimeEnabled && <span className="ml-2 text-green-500">●</span>}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Overview Chart */}
        <Card className="mb-8">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-harvest shrink-0" />
                <span className="truncate">Weather Overview - Temperature & Humidity</span>
              </CardTitle>
          </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <AreaChart data={weatherTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="fillTemperature" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-temperature)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-temperature)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="fillHumidity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-humidity)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-humidity)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={50}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="var(--color-temperature)" 
                    fill="url(#fillTemperature)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="var(--color-humidity)" 
                    fill="url(#fillHumidity)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
        </Card>

        {/* Crop Sales Visualizations */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* India Crop Sales */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="truncate">Top Crop Sales - India (₹ Crores)</span>
                {realTimeEnabled && <span className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse shrink-0"></span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] sm:h-[320px] w-full">
                <BarChart data={[...indiaCropSales].sort((a, b) => b.sales - a.sales)} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="crop" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                    interval={0}
                    fontSize={10}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    width={45}
                    fontSize={10}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`₹${(value / 1000).toFixed(1)}K Crores`, "Sales"]}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="var(--color-sales)"
                    radius={[4, 4, 0, 0]}
                  >
                    {indiaCropSales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {indiaCropSales.slice(0, 4).map((crop, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                    <span className="font-medium truncate pr-1">{crop.crop}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {crop.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs font-medium ${crop.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {crop.change > 0 ? '+' : ''}{crop.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* World Crop Sales */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0" />
                <span className="truncate">Top Crop Sales - Worldwide (Million USD)</span>
                {realTimeEnabled && <span className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse shrink-0"></span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] sm:h-[320px] w-full">
                <BarChart data={[...worldCropSales].sort((a, b) => b.sales - a.sales)} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="crop" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                    interval={0}
                    fontSize={10}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    width={55}
                    fontSize={10}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, "Sales"]}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="var(--color-sales)"
                    radius={[4, 4, 0, 0]}
                  >
                    {worldCropSales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {worldCropSales.slice(0, 4).map((crop, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                    <span className="font-medium truncate pr-1">{crop.crop}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {crop.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs font-medium ${crop.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {crop.change > 0 ? '+' : ''}{crop.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Crop Sales Pie Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* India Market Share */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="truncate">India Crop Market Share</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] sm:h-[280px] w-full">
                <PieChart>
                  <Pie
                    data={indiaCropSales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ crop, percent }) => {
                      if (percent < 0.05) return ''; // Hide labels for small slices
                      return `${crop} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={75}
                    innerRadius={25}
                    fill="#8884d8"
                    dataKey="sales"
                    fontSize={10}
                  >
                    {indiaCropSales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`₹${(value / 1000).toFixed(1)}K Crores`, "Sales"]}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* World Market Share */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0" />
                <span className="truncate">World Crop Market Share</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] sm:h-[280px] w-full">
                <PieChart>
                  <Pie
                    data={worldCropSales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ crop, percent }) => {
                      if (percent < 0.05) return ''; // Hide labels for small slices
                      return `${crop} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={75}
                    innerRadius={25}
                    fill="#8884d8"
                    dataKey="sales"
                    fontSize={10}
                  >
                    {worldCropSales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, "Sales"]}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* e-NAM Market Prices - Real-time Visualizations */}
        <div className="space-y-6 mb-8">
          {/* Header Card with State Selector */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                    <span className="truncate">e-NAM Real-Time Market Prices</span>
                    {realTimeEnabled && (
                      <span className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                    )}
                    <a 
                      href="https://enam.gov.in/web/dashboard/trade-data" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary ml-2"
                    >
                      (Source: enam.gov.in)
                    </a>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMarketPrices(true)}
                    disabled={marketLoading}
                    className="shrink-0"
                  >
                    {marketLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 w-full sm:w-auto">
                    <Label htmlFor="state-select" className="text-sm mb-2 block">
                      Select State
                    </Label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger id="state-select" className="w-full sm:w-[250px]">
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All States</SelectItem>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Showing data for: <strong className="text-foreground">{selectedState}</strong></span>
                    {marketLoading && (
                      <Loader2 className="h-3 w-3 animate-spin text-primary ml-2" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {marketLoading && marketPrices.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : marketPrices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No market data available</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Price Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                    <span className="truncate">Commodity Price Comparison - {selectedState}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart 
                      data={marketPrices.slice(0, 8).map(item => ({
                        commodity: item.commodity,
                        price: item.modalPrice,
                        min: item.minPrice,
                        max: item.maxPrice,
                      }))}
                      margin={{ top: 5, right: 10, left: 0, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="commodity" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        fontSize={11}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={60}
                        fontSize={11}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, "Modal Price"]}
                      />
                      <Bar 
                        dataKey="price" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Price Range Visualization */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-harvest shrink-0" />
                      <span className="truncate">Price Range - {selectedState}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <BarChart 
                        data={marketPrices.slice(0, 6).map(item => ({
                          commodity: item.commodity,
                          min: item.minPrice,
                          modal: item.modalPrice,
                          max: item.maxPrice,
                        }))}
                        margin={{ top: 5, right: 10, left: 0, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="commodity" 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={-35}
                          textAnchor="end"
                          height={60}
                          fontSize={11}
                        />
                        <YAxis 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={60}
                          fontSize={11}
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value: number, name: string) => [
                            `₹${value.toLocaleString()}`, 
                            name === 'min' ? 'Min Price' : name === 'modal' ? 'Modal Price' : 'Max Price'
                          ]}
                        />
                        <Bar dataKey="min" fill="hsl(0, 84%, 60%)" radius={[4, 0, 0, 4]} />
                        <Bar dataKey="modal" fill="hsl(var(--primary))" />
                        <Bar dataKey="max" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Arrivals vs Traded */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0" />
                      <span className="truncate">Arrivals vs Traded - {selectedState}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <BarChart 
                        data={marketPrices.slice(0, 6).map(item => ({
                          commodity: item.commodity,
                          arrivals: item.arrivals,
                          traded: item.traded,
                        }))}
                        margin={{ top: 5, right: 10, left: 0, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="commodity" 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={-35}
                          textAnchor="end"
                          height={60}
                          fontSize={11}
                        />
                        <YAxis 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={60}
                          fontSize={11}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value: number, name: string) => [
                            value.toLocaleString(), 
                            name === 'arrivals' ? 'Arrivals' : 'Traded'
                          ]}
                        />
                        <Bar dataKey="arrivals" fill="hsl(200, 80%, 55%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="traded" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Price Trend Over Time (if history available) */}
              {priceHistory.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                      <span className="truncate">Price Trend Over Time - {selectedState}</span>
                      {realTimeEnabled && (
                        <span className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <LineChart 
                        data={priceHistory.map((entry, idx) => {
                          const riceData = entry.data.find(d => d.commodity === "Rice");
                          const wheatData = entry.data.find(d => d.commodity === "Wheat");
                          const cornData = entry.data.find(d => d.commodity === "Corn");
                          return {
                            time: entry.time,
                            rice: riceData?.modalPrice || 0,
                            wheat: wheatData?.modalPrice || 0,
                            corn: cornData?.modalPrice || 0,
                          };
                        })}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="time" 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          fontSize={11}
                        />
                        <YAxis 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={60}
                          fontSize={11}
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value: number, name: string) => [
                            `₹${value.toLocaleString()}`, 
                            name.charAt(0).toUpperCase() + name.slice(1)
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rice" 
                          stroke="hsl(142, 76%, 36%)" 
                          strokeWidth={2}
                          dot={false}
                          name="Rice"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="wheat" 
                          stroke="hsl(40, 95%, 55%)" 
                          strokeWidth={2}
                          dot={false}
                          name="Wheat"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="corn" 
                          stroke="hsl(200, 80%, 55%)" 
                          strokeWidth={2}
                          dot={false}
                          name="Corn"
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Commodity Cards Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">All Commodities - {selectedState}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {marketPrices.map((item, index) => (
                      <Card key={index} className="border-muted hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">{item.commodity}</CardTitle>
                            <span className="text-xs text-muted-foreground">{item.unit}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.apmc}</p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Modal Price:</span>
                              <span className="text-sm font-bold text-primary">
                                ₹{item.modalPrice.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Min:</span>
                              <span>₹{item.minPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Max:</span>
                              <span>₹{item.maxPrice.toLocaleString()}</span>
                            </div>
                            <div className="pt-2 border-t border-muted grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Arrivals:</span>
                                <p className="font-medium">{item.arrivals.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Traded:</span>
                                <p className="font-medium">{item.traded.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">
                Get Crop Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                AI predicts the best crops based on your conditions
              </p>
            </CardContent>
          </Card>

          <Link to="/smart-irrigation">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="group-hover:text-blue-500 transition-colors">
                  Smart Irrigation System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ML-powered irrigation decisions using weather, NDVI, and soil data
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/groundwater-monitoring">
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="group-hover:text-cyan-500 transition-colors">
                  Groundwater Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Track groundwater levels and get 5-year predictions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-harvest/10 to-harvest/5 border-harvest/20 hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="group-hover:text-harvest transition-colors">
                Ask AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get instant answers about farming, fertilizers, and more
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;