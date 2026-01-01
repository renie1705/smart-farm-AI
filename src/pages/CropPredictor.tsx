import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sprout, TrendingUp, Calendar, CloudRain, ChevronDown, ChevronRight, GitBranch, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { getWeatherData, predictCrops } from "@/lib/gemini";
import { toast } from "sonner";

interface CropRecommendation {
  name: string;
  expectedYield: string;
  growthDuration: string;
  suitability: number;
  reason: string;
  decisionPath?: string[];
}

const CropPredictor = () => {
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [expandedCrops, setExpandedCrops] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    location: "",
    soilType: "",
    rainfall: "",
    temperature: "",
  });

  const toggleCropExpansion = (index: number) => {
    const newExpanded = new Set(expandedCrops);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCrops(newExpanded);
  };

  const getDecisionStatus = (path: string): "optimal" | "good" | "marginal" | "poor" => {
    const lowerPath = path.toLowerCase();
    if (lowerPath.includes("optimal") || lowerPath.includes("ideal")) return "optimal";
    if (lowerPath.includes("suitable") || lowerPath.includes("good")) return "good";
    if (lowerPath.includes("marginal") || lowerPath.includes("moderate")) return "marginal";
    return "poor";
  };

  const getStatusIcon = (status: "optimal" | "good" | "marginal" | "poor") => {
    switch (status) {
      case "optimal":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "good":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case "marginal":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "poor":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const fetchWeatherData = async () => {
    const currentLocation = formData.location;
    if (!currentLocation) {
      toast.error("Please enter a location first");
      return;
    }

    setWeatherLoading(true);
    try {
      const data = await getWeatherData(currentLocation);

      setFormData((prev) => ({
        ...prev,
        rainfall: data.rainfall.toString(),
        temperature: data.temperature.toString(),
      }));
      toast.success("Weather data loaded successfully!");
    } catch (error: unknown) {
      console.error("Weather fetch error:", error);
      // Use fallback data
      setFormData((prev) => ({
        ...prev,
        rainfall: "800",
        temperature: "28",
      }));
      toast.warning("Using sample weather data. Please check your Gemini API key.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!formData.location || !formData.soilType || !formData.rainfall || !formData.temperature) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const data = await predictCrops(formData);

      setRecommendations(data.recommendations);
      toast.success("Crop predictions generated successfully!");
    } catch (error: unknown) {
      console.error("Prediction error:", error);
      
      // Use fallback recommendations when API is not available
      const fallbackRecommendations: CropRecommendation[] = [
        {
          name: "Rice",
          expectedYield: "4-5 tons per hectare",
          growthDuration: "120-150 days",
          suitability: 85,
          reason: "Well-suited for your location with adequate rainfall and temperature. Rice thrives in warm, humid conditions with good water availability.",
        },
        {
          name: "Wheat",
          expectedYield: "3-4 tons per hectare",
          growthDuration: "100-120 days",
          suitability: 75,
          reason: "Good choice for your soil type and climate. Wheat requires moderate temperature and rainfall, making it suitable for your conditions.",
        },
        {
          name: "Corn",
          expectedYield: "5-6 tons per hectare",
          growthDuration: "90-110 days",
          suitability: 80,
          reason: "Excellent option with high yield potential. Corn adapts well to various soil types and benefits from your rainfall pattern.",
        },
      ];
      
      setRecommendations(fallbackRecommendations);
      toast.warning("Using sample recommendations. Please check your Gemini API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-950">
      <Navigation />
      
      <div className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-6xl mx-auto w-full">
        <div className="w-full">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-foreground">
              AI Crop Predictor
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Enter your farm conditions to get personalized crop recommendations
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Farm Conditions</CardTitle>
              <CardDescription>
                Provide accurate data for better predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Mumbai, India"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={fetchWeatherData}
                      disabled={weatherLoading || !formData.location}
                      variant="outline"
                    >
                      {weatherLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CloudRain className="h-4 w-4 mr-2" />
                          Get Weather
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">

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
                  <Label htmlFor="rainfall">Expected Rainfall (mm)</Label>
                  <Input
                    id="rainfall"
                    type="number"
                    placeholder="e.g., 800"
                    value={formData.rainfall}
                    onChange={(e) => setFormData({ ...formData, rainfall: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Avg. Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    placeholder="e.g., 28"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={handlePredict}
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
                    <Sprout className="mr-2 h-4 w-4" />
                    Get Crop Recommendations
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {recommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  Top Crop Recommendations
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GitBranch className="h-4 w-4" />
                  <span>Powered by Decision Tree Algorithm</span>
                </div>
              </div>
              {recommendations.map((crop, index) => (
                <Card key={index} className="border-primary/20 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-primary">
                        {index + 1}. {crop.name}
                      </CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Suitability: {crop.suitability}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Yield</p>
                          <p className="font-medium">{crop.expectedYield}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-harvest" />
                        <div>
                          <p className="text-xs text-muted-foreground">Growth Duration</p>
                          <p className="font-medium">{crop.growthDuration}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{crop.reason}</p>
                    
                    {crop.decisionPath && crop.decisionPath.length > 0 && (
                      <Collapsible
                        open={expandedCrops.has(index)}
                        onOpenChange={() => toggleCropExpansion(index)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4" />
                              <span>View Decision Tree Flow</span>
                            </div>
                            {expandedCrops.has(index) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <div className="border rounded-lg p-4 bg-muted/50">
                            <h4 className="font-semibold mb-3 text-sm">Decision Tree Evaluation Path</h4>
                            <div className="space-y-2">
                              {crop.decisionPath.map((path, pathIndex) => {
                                const [key, value] = path.split(": ");
                                const status = getDecisionStatus(value);
                                return (
                                  <div
                                    key={pathIndex}
                                    className="flex items-start gap-3 p-2 rounded-md bg-background border"
                                  >
                                    <div className="mt-0.5">{getStatusIcon(status)}</div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{key}:</span>
                                        <span className="text-sm text-muted-foreground">{value}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  <span>Optimal</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-blue-500" />
                                  <span>Good</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                  <span>Marginal</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  <span>Poor</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropPredictor;