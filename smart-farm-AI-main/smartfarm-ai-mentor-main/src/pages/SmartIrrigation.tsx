import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Droplets, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Leaf,
  Sprout,
  CloudRain,
  Sun,
  ThermometerSun,
  AlertTriangle
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { getWeatherData, type WeatherData } from "@/lib/gemini";
import {
  predictIrrigationNeeds,
  predictSoilMoisture,
  fetchNDVIData,
  recommendFertilizer,
  forecastYield,
  type IrrigationInput,
  type IrrigationPrediction,
  type SoilMoisturePrediction,
  type NDVIData,
  type FertilizerRecommendation,
  type YieldForecast,
} from "@/lib/irrigationML";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";

const SmartIrrigation = () => {
  const [loading, setLoading] = useState(false);
  const [irrigationData, setIrrigationData] = useState<IrrigationPrediction | null>(null);
  const [soilMoisture, setSoilMoisture] = useState<SoilMoisturePrediction | null>(null);
  const [ndviData, setNdviData] = useState<NDVIData | null>(null);
  const [fertilizerRecs, setFertilizerRecs] = useState<FertilizerRecommendation[]>([]);
  const [yieldForecast, setYieldForecast] = useState<YieldForecast | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  
  const [formData, setFormData] = useState({
    location: "Coimbatore, India",
    cropType: "Rice",
    soilType: "Loamy",
    cropStage: "Vegetative",
    daysSincePlanting: "45",
    lastIrrigationDate: "",
    soilMoisture: "",
  });

  const cropTypes = ["Rice", "Wheat", "Corn", "Tomato", "Potato", "Sugarcane", "Cotton", "Soybean"];
  const cropStages = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Maturity"];

  const fetchWeatherAndAnalyze = async () => {
    if (!formData.location || !formData.cropType || !formData.soilType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Fetch weather data
      const weather = await getWeatherData(formData.location);
      setWeatherData(weather);

      // Fetch NDVI data
      const ndvi = await fetchNDVIData(formData.location, formData.cropType);
      setNdviData(ndvi);

      // Prepare input for ML models
      const input: IrrigationInput = {
        location: formData.location,
        cropType: formData.cropType,
        soilType: formData.soilType,
        cropStage: formData.cropStage as IrrigationInput["cropStage"],
        daysSincePlanting: parseInt(formData.daysSincePlanting) || 0,
        currentTemperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
        sunshine: weather.sunshine,
        soilMoisture: formData.soilMoisture ? parseFloat(formData.soilMoisture) : undefined,
        ndviValue: ndvi.value,
        lastIrrigationDate: formData.lastIrrigationDate || undefined,
      };

      // Run ML predictions
      const irrigation = predictIrrigationNeeds(input);
      const moisture = predictSoilMoisture(input);
      const fertilizers = recommendFertilizer(
        formData.cropType,
        formData.cropStage,
        formData.soilType,
        ndvi.value,
        parseInt(formData.daysSincePlanting) || 0
      );
      const yieldForecastData = forecastYield(
        formData.cropType,
        irrigation,
        moisture,
        ndvi,
        {
          temperature: weather.temperature,
          rainfall: weather.rainfall,
          sunshine: weather.sunshine,
        },
        parseInt(formData.daysSincePlanting) || 0
      );

      setIrrigationData(irrigation);
      setSoilMoisture(moisture);
      setFertilizerRecs(fertilizers);
      setYieldForecast(yieldForecastData);

      toast.success("Irrigation analysis completed!");
    } catch (error) {
      console.error("Error analyzing irrigation:", error);
      toast.error("Failed to analyze irrigation needs");
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Critical":
        return "text-red-500";
      case "High":
        return "text-orange-500";
      case "Medium":
        return "text-yellow-500";
      case "Low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getUrgencyBgColor = (urgency: string) => {
    switch (urgency) {
      case "Critical":
        return "bg-red-500/10 border-red-500/20";
      case "High":
        return "bg-orange-500/10 border-orange-500/20";
      case "Medium":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "Low":
        return "bg-green-500/10 border-green-500/20";
      default:
        return "bg-gray-500/10 border-gray-500/20";
    }
  };

  // Historical data for charts (simulated)
  const irrigationHistory = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      moisture: 50 + Math.random() * 20,
      irrigation: Math.random() > 0.5 ? 15 + Math.random() * 10 : 0,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navigation />
      
      <div className="container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Smart Irrigation System
            </h1>
            <p className="text-muted-foreground text-lg">
              AI-powered irrigation decisions using ML, weather data, NDVI, and soil analysis
            </p>
          </div>

          {/* Input Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Farm & Crop Information</CardTitle>
              <CardDescription>
                Provide details to get intelligent irrigation recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Coimbatore, India"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cropType">Crop Type</Label>
                  <Select
                    value={formData.cropType}
                    onValueChange={(value) => setFormData({ ...formData, cropType: value })}
                  >
                    <SelectTrigger id="cropType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cropTypes.map((crop) => (
                        <SelectItem key={crop} value={crop}>
                          {crop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Input
                    id="soilType"
                    placeholder="e.g., Loamy, Clay, Sandy"
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cropStage">Crop Stage</Label>
                  <Select
                    value={formData.cropStage}
                    onValueChange={(value) => setFormData({ ...formData, cropStage: value })}
                  >
                    <SelectTrigger id="cropStage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cropStages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daysSincePlanting">Days Since Planting</Label>
                  <Input
                    id="daysSincePlanting"
                    type="number"
                    value={formData.daysSincePlanting}
                    onChange={(e) => setFormData({ ...formData, daysSincePlanting: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soilMoisture">Current Soil Moisture (%) (Optional)</Label>
                  <Input
                    id="soilMoisture"
                    type="number"
                    placeholder="Auto-calculated if not provided"
                    value={formData.soilMoisture}
                    onChange={(e) => setFormData({ ...formData, soilMoisture: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="lastIrrigationDate">Last Irrigation Date (Optional)</Label>
                  <Input
                    id="lastIrrigationDate"
                    type="date"
                    value={formData.lastIrrigationDate}
                    onChange={(e) => setFormData({ ...formData, lastIrrigationDate: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={fetchWeatherAndAnalyze}
                disabled={loading}
                className="w-full mt-6"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Analyze Irrigation Needs
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {irrigationData && (
            <div className="space-y-6">
              {/* Irrigation Recommendation */}
              <Card className={`border-2 ${getUrgencyBgColor(irrigationData.urgency)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="h-5 w-5" />
                      Irrigation Recommendation
                    </CardTitle>
                    <span className={`text-lg font-bold ${getUrgencyColor(irrigationData.urgency)}`}>
                      {irrigationData.urgency} Priority
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {irrigationData.irrigationNeeded ? (
                          <AlertCircle className="h-6 w-6 text-orange-500" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        )}
                        <div>
                          <p className="font-semibold">
                            {irrigationData.irrigationNeeded ? "Irrigation Required" : "No Irrigation Needed"}
                          </p>
                          <p className="text-sm text-muted-foreground">{irrigationData.reason}</p>
                        </div>
                      </div>
                      
                      {irrigationData.irrigationNeeded && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Recommended Water Amount:</span>
                            <span className="text-lg font-bold text-primary">
                              {irrigationData.recommendedWaterAmount} mm
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Next Irrigation Date:</span>
                            <span className="text-sm font-medium">
                              {new Date(irrigationData.nextIrrigationDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Confidence:</span>
                            <span className="text-sm font-medium">{irrigationData.confidence}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {weatherData && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <ThermometerSun className="h-4 w-4 text-orange-500" />
                              <span className="text-xs text-muted-foreground">Temperature</span>
                            </div>
                            <p className="text-lg font-bold">{weatherData.temperature}°C</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Droplets className="h-4 w-4 text-blue-500" />
                              <span className="text-xs text-muted-foreground">Humidity</span>
                            </div>
                            <p className="text-lg font-bold">{weatherData.humidity}%</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <CloudRain className="h-4 w-4 text-blue-600" />
                              <span className="text-xs text-muted-foreground">Rainfall</span>
                            </div>
                            <p className="text-lg font-bold">{weatherData.rainfall}mm</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Sun className="h-4 w-4 text-yellow-500" />
                              <span className="text-xs text-muted-foreground">Sunshine</span>
                            </div>
                            <p className="text-lg font-bold">{weatherData.sunshine}h</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Soil Moisture & NDVI */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Soil Moisture Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {soilMoisture && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current Moisture:</span>
                          <span className="text-2xl font-bold text-primary">
                            {soilMoisture.currentMoisture}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Optimal Range:</span>
                          <span className="text-sm font-medium">55-65%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Deficit:</span>
                          <span className={`text-sm font-medium ${soilMoisture.deficit > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                            {soilMoisture.deficit > 0 ? '+' : ''}{soilMoisture.deficit}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <span className={`text-sm font-medium ${
                            soilMoisture.status === 'Optimal' ? 'text-green-500' :
                            soilMoisture.status === 'Low' ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {soilMoisture.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Trend:</span>
                          <div className="flex items-center gap-1">
                            {soilMoisture.trend === 'Increasing' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : soilMoisture.trend === 'Decreasing' ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Activity className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-sm font-medium">{soilMoisture.trend}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-5 w-5" />
                      NDVI Vegetation Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ndviData && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">NDVI Value:</span>
                          <span className="text-2xl font-bold text-primary">
                            {ndviData.value}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Health Status:</span>
                          <span className={`text-sm font-medium ${
                            ndviData.health === 'Excellent' ? 'text-green-500' :
                            ndviData.health === 'Good' ? 'text-blue-500' :
                            ndviData.health === 'Fair' ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {ndviData.health}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Vegetation Density:</span>
                          <span className="text-sm font-medium">{ndviData.vegetationDensity}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Stress Level:</span>
                          <span className={`text-sm font-medium ${
                            ndviData.stressLevel < 30 ? 'text-green-500' :
                            ndviData.stressLevel < 50 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {ndviData.stressLevel}%
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Historical Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Soil Moisture Trend (7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                      <AreaChart data={irrigationHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="moisture"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Irrigation History (7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                      <BarChart data={irrigationHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="irrigation" fill="hsl(200, 80%, 55%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Fertilizer Recommendations */}
              {fertilizerRecs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sprout className="h-5 w-5" />
                      Fertilizer Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fertilizerRecs.map((rec, index) => (
                        <Card key={index} className="border-muted">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{rec.type}</CardTitle>
                              <span className={`text-xs px-2 py-1 rounded ${
                                rec.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                                rec.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-green-500/10 text-green-500'
                              }`}>
                                {rec.priority} Priority
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid gap-3 md:grid-cols-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Amount: </span>
                                <span className="font-medium">{rec.amount} {rec.type.includes('Compost') ? 'kg/ha' : 'kg/ha'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Timing: </span>
                                <span className="font-medium">{rec.timing}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Method: </span>
                                <span className="font-medium">{rec.method}</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-3">{rec.reason}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Yield Forecast */}
              {yieldForecast && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Yield Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                        <span className="text-lg font-medium">Predicted Yield:</span>
                        <span className="text-3xl font-bold text-primary">
                          {yieldForecast.predictedYield} tons/ha
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Confidence:</span>
                        <span className="text-sm font-medium">{yieldForecast.confidence}%</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Yield Factors:</p>
                        {yieldForecast.factors.map((factor, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                            {factor.impact === 'Positive' ? (
                              <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                            ) : factor.impact === 'Negative' ? (
                              <TrendingDown className="h-4 w-4 text-red-500 mt-0.5" />
                            ) : (
                              <Activity className="h-4 w-4 text-gray-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <span className="text-sm font-medium">{factor.factor}: </span>
                              <span className={`text-sm ${
                                factor.impact === 'Positive' ? 'text-green-600' :
                                factor.impact === 'Negative' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {factor.description}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {yieldForecast.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Recommendations to Improve Yield:</p>
                          {yieldForecast.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                              <span className="text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartIrrigation;

