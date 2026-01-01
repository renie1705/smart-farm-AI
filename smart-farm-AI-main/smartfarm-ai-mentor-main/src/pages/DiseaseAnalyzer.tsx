import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Leaf, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { analyzePlantDisease } from "@/lib/gemini";
import { toast } from "sonner";

interface DiseaseAnalysis {
  disease: string;
  confidence: number;
  severity: string;
  remedy: string;
  preventiveMeasures: string[];
}

const DiseaseAnalyzer = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DiseaseAnalysis | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Analyze image
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      
      // Set preview from the same base64
      setImagePreview(base64);
      
      const data = await analyzePlantDisease(base64);

      setAnalysis(data);
      toast.success("Analysis complete!");
    } catch (error: unknown) {
      console.error("Analysis error:", error);
      
      // Use fallback analysis when API is not available
      const fallbackAnalysis: DiseaseAnalysis = {
        disease: "Leaf Spot Disease",
        confidence: 75,
        severity: "Medium",
        remedy: "Apply a fungicide containing copper or neem oil. Remove affected leaves and ensure proper air circulation. Water at the base of the plant to avoid wetting leaves.",
        preventiveMeasures: [
          "Ensure proper spacing between plants for air circulation",
          "Water plants at the base, avoiding overhead watering",
          "Remove and destroy infected plant debris",
          "Apply preventive fungicides during growing season",
          "Maintain proper soil drainage to prevent waterlogging"
        ],
      };
      
      setAnalysis(fallbackAnalysis);
      toast.warning("Using sample analysis. Please check your Gemini API key.");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-harvest";
      case "low":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navigation />
      
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Plant Disease Analyzer
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload plant leaf images to detect diseases and get treatment recommendations
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Plant Image</CardTitle>
              <CardDescription>
                Take a clear photo of the affected leaf or plant part
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-full h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Plant preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No image selected</p>
                    </div>
                  )}
                </div>

                <label htmlFor="image-upload" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                    asChild
                  >
                    <span>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Analyze Image
                        </>
                      )}
                    </span>
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {analysis && (
            <Card className="border-accent/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-accent">
                    Analysis Results
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {analysis.confidence}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    Detected Issue
                  </h3>
                  <p className="text-xl font-medium text-primary">{analysis.disease}</p>
                  <p className={`text-sm mt-1 font-medium ${getSeverityColor(analysis.severity)}`}>
                    Severity: {analysis.severity}
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Recommended Treatment</h4>
                      <p className="text-sm text-muted-foreground">{analysis.remedy}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Preventive Measures</h4>
                  <ul className="space-y-2">
                    {analysis.preventiveMeasures.map((measure, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        <span>{measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseAnalyzer;