import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Droplets, TrendingDown, TrendingUp, AlertTriangle, RefreshCw, Loader2, Download } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  fetchGroundwaterData, 
  calculateStats, 
  getTopStatesByAvailability,
  getStatesByExtractionStage,
  type GroundwaterData 
} from "@/lib/groundwaterApi";
import { 
  generatePredictions, 
  generateAggregatePredictions,
  getPredictionSummary,
  type StatePrediction 
} from "@/lib/groundwaterPrediction";
import { toast } from "sonner";

const GroundwaterMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [groundwaterData, setGroundwaterData] = useState<GroundwaterData[]>([]);
  const [selectedState, setSelectedState] = useState<string>("All");
  const [statePrediction, setStatePrediction] = useState<StatePrediction | null>(null);
  const [sortBy, setSortBy] = useState<keyof GroundwaterData>("stageOfExtraction");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const chartConfig = {
    availability: {
      label: "Availability",
      color: "hsl(200, 80%, 55%)",
    },
    utilization: {
      label: "Utilization",
      color: "hsl(142, 76%, 36%)",
    },
    extraction: {
      label: "Extraction %",
      color: "hsl(40, 95%, 55%)",
    },
    prediction: {
      label: "Prediction",
      color: "hsl(280, 70%, 50%)",
    },
    confidence: {
      label: "Confidence Range",
      color: "hsl(280, 70%, 50%)",
    },
  };

  useEffect(() => {
    loadGroundwaterData();
  }, []);

  useEffect(() => {
    if (selectedState !== "All" && groundwaterData.length > 0) {
      const stateData = groundwaterData.find(d => d.state === selectedState);
      if (stateData) {
        const prediction = generatePredictions(stateData);
        setStatePrediction(prediction);
      }
    } else {
      setStatePrediction(null);
    }
  }, [selectedState, groundwaterData]);

  const loadGroundwaterData = async () => {
    setLoading(true);
    try {
      const data = await fetchGroundwaterData();
      setGroundwaterData(data);
      toast.success("Groundwater data loaded successfully");
    } catch (error) {
      console.error("Error loading groundwater data:", error);
      toast.error("Failed to load data, using sample data");
    } finally {
      setLoading(false);
    }
  };

  const stats = groundwaterData.length > 0 ? calculateStats(groundwaterData) : null;
  const topStates = groundwaterData.length > 0 ? getTopStatesByAvailability(groundwaterData, 10) : [];
  const statesByStage = groundwaterData.length > 0 ? getStatesByExtractionStage(groundwaterData) : null;
  
  const aggregatePredictions = groundwaterData.length > 0 
    ? generateAggregatePredictions(groundwaterData) 
    : [];

  const selectedStateData = selectedState !== "All" 
    ? groundwaterData.find(d => d.state === selectedState) 
    : null;

  const sortedData = [...groundwaterData].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortOrder === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const getExtractionBadge = (extraction: number) => {
    if (extraction > 90) return <Badge variant="destructive">Critical</Badge>;
    if (extraction > 70) return <Badge className="bg-orange-500">Over-Exploited</Badge>;
    if (extraction > 40) return <Badge className="bg-yellow-500">Semi-Critical</Badge>;
    return <Badge className="bg-green-500">Safe</Badge>;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining' || trend === 'critical') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const handleSort = (column: keyof GroundwaterData) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const exportData = () => {
    const csv = [
      ['State', 'Net Availability (BCM)', 'Total Extraction (BCM)', 'Stage of Extraction (%)', 'Status'].join(','),
      ...groundwaterData.map(d => 
        [d.state, d.netGroundwaterAvailability, d.totalAnnualExtraction, d.stageOfExtraction, 
         d.stageOfExtraction > 70 ? 'Critical' : d.stageOfExtraction > 40 ? 'Semi-Critical' : 'Safe'].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groundwater-data-2024.csv';
    a.click();
    toast.success("Data exported successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <Navigation />
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navigation />
      
      {/* Header */}
      <section className="relative bg-gradient-to-r from-blue-600/10 to-blue-400/10 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Droplets className="h-8 w-8 text-blue-500" />
                Groundwater Monitoring
              </h1>
              <p className="text-muted-foreground text-lg">
                Real-time monitoring and 5-year predictions for India's groundwater resources
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadGroundwaterData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        {/* State Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select State for Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All States (Aggregate)</SelectItem>
                {groundwaterData.map((data) => (
                  <SelectItem key={data.state} value={data.state}>
                    {data.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Availability
              </CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {selectedStateData 
                  ? selectedStateData.netGroundwaterAvailability.toFixed(2)
                  : stats?.totalAvailability.toFixed(2)} BCM
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedState !== "All" ? selectedState : "All India"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Annual Extraction
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {selectedStateData 
                  ? selectedStateData.totalAnnualExtraction.toFixed(2)
                  : stats?.totalUtilization.toFixed(2)} BCM
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current usage
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Extraction Stage
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {selectedStateData 
                  ? selectedStateData.stageOfExtraction.toFixed(1)
                  : stats?.averageExtraction.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedStateData ? getExtractionBadge(selectedStateData.stageOfExtraction) : "Average"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Critical States
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {statesByStage?.critical.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Over 90% extraction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 5-Year Predictions */}
        {selectedState !== "All" && statePrediction && (
          <Card className="mb-8 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                5-Year Prediction for {selectedState}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {getPredictionSummary(statePrediction)}
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart 
                  data={[
                    {
                      year: 2024,
                      availability: selectedStateData!.netGroundwaterAvailability,
                      extraction: selectedStateData!.stageOfExtraction,
                    },
                    ...statePrediction.predictions.map(p => ({
                      year: p.year,
                      availability: p.availability,
                      extraction: p.extraction,
                      confidenceLow: p.confidenceLow,
                      confidenceHigh: p.confidenceHigh,
                    }))
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillAvailability" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-availability)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-availability)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-confidence)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-confidence)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="year" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    label={{ value: 'BCM', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    label={{ value: '%', angle: 90, position: 'insideRight' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="confidenceHigh" 
                    stroke="none"
                    fill="url(#fillConfidence)"
                    fillOpacity={0.3}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="confidenceLow" 
                    stroke="none"
                    fill="url(#fillConfidence)"
                    fillOpacity={0.3}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="availability" 
                    stroke="var(--color-availability)" 
                    fill="url(#fillAvailability)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="extraction" 
                    stroke="var(--color-extraction)" 
                    strokeWidth={2}
                    dot={{ fill: "var(--color-extraction)" }}
                  />
                </AreaChart>
              </ChartContainer>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {getTrendIcon(statePrediction.trend)}
                  <span className="capitalize">{statePrediction.trend} Trend</span>
                </div>
                <Badge 
                  variant={statePrediction.riskLevel === 'critical' ? 'destructive' : 'default'}
                  className={
                    statePrediction.riskLevel === 'high' ? 'bg-orange-500' :
                    statePrediction.riskLevel === 'medium' ? 'bg-yellow-500' :
                    statePrediction.riskLevel === 'low' ? 'bg-green-500' : ''
                  }
                >
                  {statePrediction.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aggregate Predictions for All States */}
        {selectedState === "All" && aggregatePredictions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                National 5-Year Groundwater Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart 
                  data={aggregatePredictions}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillAggAvailability" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-availability)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-availability)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="year" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="confidenceHigh" 
                    stroke="none"
                    fill="var(--color-confidence)"
                    fillOpacity={0.2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="confidenceLow" 
                    stroke="none"
                    fill="var(--color-confidence)"
                    fillOpacity={0.2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="availability" 
                    stroke="var(--color-availability)" 
                    fill="url(#fillAggAvailability)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Top States by Availability */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top 10 States by Groundwater Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart 
                data={topStates}
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  label={{ value: 'BCM', position: 'right', offset: 10 }}
                />
                <YAxis 
                  type="category"
                  dataKey="state"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={140}
                  fontSize={11}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="netGroundwaterAvailability" 
                  fill="var(--color-availability)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* State-wise Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed State-wise Groundwater Data (2024)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('state')}
                    >
                      State {sortBy === 'state' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted text-right"
                      onClick={() => handleSort('netGroundwaterAvailability')}
                    >
                      Availability (BCM) {sortBy === 'netGroundwaterAvailability' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted text-right"
                      onClick={() => handleSort('totalAnnualExtraction')}
                    >
                      Extraction (BCM) {sortBy === 'totalAnnualExtraction' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted text-right"
                      onClick={() => handleSort('stageOfExtraction')}
                    >
                      Stage (%) {sortBy === 'stageOfExtraction' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((data) => (
                    <TableRow key={data.state}>
                      <TableCell className="font-medium">{data.state}</TableCell>
                      <TableCell className="text-right">{data.netGroundwaterAvailability.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{data.totalAnnualExtraction.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{data.stageOfExtraction.toFixed(2)}</TableCell>
                      <TableCell>{getExtractionBadge(data.stageOfExtraction)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default GroundwaterMonitoring;