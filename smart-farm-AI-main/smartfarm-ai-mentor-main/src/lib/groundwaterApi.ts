/**
 * Groundwater Data API Service
 * Fetches groundwater data from OpenCity India dataset
 */

export interface GroundwaterData {
  slNo: number;
  state: string;
  monsoonRecharge: number;
  nonMonsoonRecharge: number;
  totalAnnualRecharge: number;
  totalNaturalDischarge: number;
  netGroundwaterAvailability: number;
  annualExtraction: number;
  irrigation: number;
  industrial: number;
  domestic: number;
  totalAnnualExtraction: number;
  stageOfExtraction: number;
}

export interface GroundwaterStats {
  totalAvailability: number;
  totalUtilization: number;
  averageExtraction: number;
  criticalStates: string[];
  safeStates: string[];
}

/**
 * Fetch groundwater data from OpenCity India
 */
export async function fetchGroundwaterData(): Promise<GroundwaterData[]> {
  try {
    // Try to fetch from OpenCity API
    const csvUrl = "https://data.opencity.in/dataset/3dd8e4ad-2b45-40ee-917f-1337a05b8ab9/resource/ea156058-114e-48d4-b70a-7f266536d94f/download/india-states-2024.csv";
    
    // Use CORS proxy to fetch the CSV
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`;
    
    const response = await fetch(proxyUrl);
    
    if (response.ok) {
      const data = await response.json();
      const csvContent = data.contents;
      return parseGroundwaterCSV(csvContent);
    }
    
    throw new Error("Failed to fetch groundwater data");
  } catch (error) {
    console.error("Error fetching groundwater data:", error);
    // Return sample data based on the screenshot
    return getSampleGroundwaterData();
  }
}

/**
 * Parse CSV content into GroundwaterData array
 */
function parseGroundwaterCSV(csvContent: string): GroundwaterData[] {
  const lines = csvContent.trim().split('\n');
  const data: GroundwaterData[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    
    if (values.length >= 14) {
      data.push({
        slNo: parseInt(values[0]) || i,
        state: values[1] || '',
        monsoonRecharge: parseFloat(values[2]) || 0,
        nonMonsoonRecharge: parseFloat(values[3]) || 0,
        totalAnnualRecharge: parseFloat(values[4]) || 0,
        totalNaturalDischarge: parseFloat(values[5]) || 0,
        netGroundwaterAvailability: parseFloat(values[6]) || 0,
        annualExtraction: parseFloat(values[7]) || 0,
        irrigation: parseFloat(values[8]) || 0,
        industrial: parseFloat(values[9]) || 0,
        domestic: parseFloat(values[10]) || 0,
        totalAnnualExtraction: parseFloat(values[11]) || 0,
        stageOfExtraction: parseFloat(values[12]) || 0,
      });
    }
  }
  
  return data;
}

/**
 * Get sample groundwater data (based on OpenCity screenshot)
 */
function getSampleGroundwaterData(): GroundwaterData[] {
  return [
    {
      slNo: 1,
      state: "Andhra Pradesh",
      monsoonRecharge: 9.1,
      nonMonsoonRecharge: 0.82,
      totalAnnualRecharge: 9.92,
      totalNaturalDischarge: 1.39,
      netGroundwaterAvailability: 7.88,
      annualExtraction: 26.41,
      irrigation: 6.75,
      industrial: 0.13,
      domestic: 1,
      totalAnnualExtraction: 1.24,
      stageOfExtraction: 20.83,
    },
    {
      slNo: 2,
      state: "Arunachal Pradesh",
      monsoonRecharge: 2.16,
      nonMonsoonRecharge: 0.27,
      totalAnnualRecharge: 1.11,
      totalNaturalDischarge: 0.34,
      netGroundwaterAvailability: 3.88,
      annualExtraction: 0.42,
      irrigation: 3.46,
      industrial: 0.01,
      domestic: 0.01,
      totalAnnualExtraction: 0.01,
      stageOfExtraction: 0.39,
    },
    {
      slNo: 3,
      state: "Assam",
      monsoonRecharge: 19.45,
      nonMonsoonRecharge: 0.67,
      totalAnnualRecharge: 6.53,
      totalNaturalDischarge: 0.56,
      netGroundwaterAvailability: 27.21,
      annualExtraction: 6.32,
      irrigation: 20.89,
      industrial: 2.06,
      domestic: 0.01,
      totalAnnualExtraction: 2.84,
      stageOfExtraction: 0.58,
      
    },
    {
      slNo: 4,
      state: "Bihar",
      monsoonRecharge: 19.54,
      nonMonsoonRecharge: 8.05,
      totalAnnualRecharge: 1.14,
      totalNaturalDischarge: 5.42,
      netGroundwaterAvailability: 34.15,
      annualExtraction: 3.19,
      irrigation: 30.95,
      industrial: 10.21,
      domestic: 0.4,
      totalAnnualExtraction: 3.48,
      stageOfExtraction: 14.1,
    },
    {
      slNo: 5,
      state: "Chhattisgarh",
      monsoonRecharge: 8.67,
      nonMonsoonRecharge: 3.43,
      totalAnnualRecharge: 0.15,
      totalNaturalDischarge: 2.03,
      netGroundwaterAvailability: 14.16,
      annualExtraction: 1.26,
      irrigation: 12.93,
      industrial: 5.21,
      domestic: 0.14,
      totalAnnualExtraction: 0.77,
      stageOfExtraction: 6.12,
    },
    {
      slNo: 6,
      state: "Goa",
      monsoonRecharge: 0.35,
      nonMonsoonRecharge: 0.01,
      totalAnnualRecharge: 0,
      totalNaturalDischarge: 0.03,
      netGroundwaterAvailability: 0.38,
      annualExtraction: 0.08,
      irrigation: 0.31,
      industrial: 0.03,
      domestic: 0,
      totalAnnualExtraction: 0.04,
      stageOfExtraction: 0.07,
    },
    {
      slNo: 7,
      state: "Gujarat",
      monsoonRecharge: 18.58,
      nonMonsoonRecharge: 2.76,
      totalAnnualRecharge: 0,
      totalNaturalDischarge: 5.21,
      netGroundwaterAvailability: 27.55,
      annualExtraction: 2,
      irrigation: 25.58,
      industrial: 12.81,
      domestic: 0.21,
      totalAnnualExtraction: 0.85,
      stageOfExtraction: 13.86,
    },
    {
      slNo: 8,
      state: "Haryana",
      monsoonRecharge: 3.26,
      nonMonsoonRecharge: 3.51,
      totalAnnualRecharge: 0.67,
      totalNaturalDischarge: 2.86,
      netGroundwaterAvailability: 10.32,
      annualExtraction: 0.96,
      irrigation: 9.38,
      industrial: 11.47,
      domestic: 0.58,
      totalAnnualExtraction: 0.87,
      stageOfExtraction: 12.72,
    },
    {
      slNo: 9,
      state: "Himachal Pradesh",
      monsoonRecharge: 0.61,
      nonMonsoonRecharge: 0.18,
      totalAnnualRecharge: 0.13,
      totalNaturalDischarge: 0.2,
      netGroundwaterAvailability: 1.11,
      annualExtraction: 0.1,
      irrigation: 1.01,
      industrial: 0.19,
      domestic: 0.06,
      totalAnnualExtraction: 0.12,
      stageOfExtraction: 0.96,
    },
    {
      slNo: 10,
      state: "Jharkhand",
      monsoonRecharge: 4.98,
      nonMonsoonRecharge: 0.46,
      totalAnnualRecharge: 0.47,
      totalNaturalDischarge: 0.37,
      netGroundwaterAvailability: 6.28,
      annualExtraction: 0.52,
      irrigation: 5.76,
      industrial: 0.94,
      domestic: 0.22,
      totalAnnualExtraction: 0.65,
      stageOfExtraction: 1.81,
    },
    {
      slNo: 11,
      state: "Karnataka",
      monsoonRecharge: 8.79,
      nonMonsoonRecharge: 5.01,
      totalAnnualRecharge: 1.23,
      totalNaturalDischarge: 3.7,
      netGroundwaterAvailability: 18.74,
      annualExtraction: 1.86,
      irrigation: 16.88,
      industrial: 10.18,
      domestic: 0.19,
      totalAnnualExtraction: 1.22,
      stageOfExtraction: 11.55,
    },
    {
      slNo: 12,
      state: "Kerala",
      monsoonRecharge: 4.19,
      nonMonsoonRecharge: 0.13,
      totalAnnualRecharge: 0.49,
      totalNaturalDischarge: 0.85,
      netGroundwaterAvailability: 5.67,
      annualExtraction: 0.54,
      irrigation: 5.13,
      industrial: 1.12,
      domestic: 0.01,
      totalAnnualExtraction: 1.63,
      stageOfExtraction: 2.76,
    },
    {
      slNo: 13,
      state: "Madhya Pradesh",
      monsoonRecharge: 27,
      nonMonsoonRecharge: 1.68,
      totalAnnualRecharge: 0.17,
      totalNaturalDischarge: 7.04,
      netGroundwaterAvailability: 35.9,
      annualExtraction: 1.91,
      irrigation: 33.99,
      industrial: 17.9,
      domestic: 0.2,
      totalAnnualExtraction: 1.76,
      stageOfExtraction: 19.85,
    },
    {
      slNo: 14,
      state: "Maharashtra",
      monsoonRecharge: 20.69,
      nonMonsoonRecharge: 2.76,
      totalAnnualRecharge: 0.73,
      totalNaturalDischarge: 8.85,
      netGroundwaterAvailability: 33.03,
      annualExtraction: 1.89,
      irrigation: 31.15,
      industrial: 15.07,
      domestic: 0.03,
      totalAnnualExtraction: 1.4,
      stageOfExtraction: 16.5,
    },
    {
      slNo: 15,
      state: "Manipur",
      monsoonRecharge: 0.4,
      nonMonsoonRecharge: 0.009,
      totalAnnualRecharge: 0.11,
      totalNaturalDischarge: 0.006,
      netGroundwaterAvailability: 0.52,
      annualExtraction: 0.05,
      irrigation: 0.47,
      industrial: 0.017,
      domestic: 0.0002,
      totalAnnualExtraction: 0.02,
      stageOfExtraction: 0.04,
    },
    {
      slNo: 16,
      state: "Meghalaya",
      monsoonRecharge: 1.35,
      nonMonsoonRecharge: 0.06,
      totalAnnualRecharge: 0.42,
      totalNaturalDischarge: 0.04,
      netGroundwaterAvailability: 1.86,
      annualExtraction: 0.33,
      irrigation: 1.53,
      industrial: 0.02,
      domestic: 0,
      totalAnnualExtraction: 0.05,
      stageOfExtraction: 0.07,
    },
    {
      slNo: 17,
      state: "Mizoram",
      monsoonRecharge: 0.18,
      nonMonsoonRecharge: 0,
      totalAnnualRecharge: 0.03,
      totalNaturalDischarge: 0,
      netGroundwaterAvailability: 0.21,
      annualExtraction: 0.02,
      irrigation: 0.19,
      industrial: 0,
      domestic: 0,
      totalAnnualExtraction: 0.01,
      stageOfExtraction: 0.01,
    },
    {
      slNo: 18,
      state: "Nagaland",
      monsoonRecharge: 0.41,
      nonMonsoonRecharge: 0.12,
      totalAnnualRecharge: 0.08,
      totalNaturalDischarge: 0.01,
      netGroundwaterAvailability: 0.62,
      annualExtraction: 0.05,
      irrigation: 0.56,
      industrial: 0.01,
      domestic: 0,
      totalAnnualExtraction: 0.02,
      stageOfExtraction: 0.03,
    },
    {
      slNo: 19,
      state: "Odisha",
      monsoonRecharge: 10.19,
      nonMonsoonRecharge: 3.94,
      totalAnnualRecharge: 1.51,
      totalNaturalDischarge: 2.64,
      netGroundwaterAvailability: 17.46,
      annualExtraction: 1.42,
      irrigation: 16.04,
      industrial: 6.26,
      domestic: 0.19,
      totalAnnualExtraction: 1.26,
      stageOfExtraction: 7.74,
    },
    {
      slNo: 20,
      state: "Punjab",
      monsoonRecharge: 4.79,
      nonMonsoonRecharge: 8.01,
      totalAnnualRecharge: 0.72,
      totalNaturalDischarge: 4.37,
      netGroundwaterAvailability: 19.19,
      annualExtraction: 1.87,
      irrigation: 17.83,
      industrial: 26.24,
      domestic: 0.25,
      totalAnnualExtraction: 1.18,
      stageOfExtraction: 27.66,
    },
    {
      slNo: 21,
      state: "Rajasthan",
      monsoonRecharge: 9.08,
      nonMonsoonRecharge: 0.65,
      totalAnnualRecharge: 0.22,
      totalNaturalDischarge: 2.62,
      netGroundwaterAvailability: 12.58,
      annualExtraction: 1.2,
      irrigation: 11.37,
      industrial: 14.51,
      domestic: 0.13,
      totalAnnualExtraction: 2.41,
      stageOfExtraction: 17.05,
    },
    {
      slNo: 22,
      state: "Sikkim",
      monsoonRecharge: 0.18,
      nonMonsoonRecharge: 0,
      totalAnnualRecharge: 0.06,
      totalNaturalDischarge: 0,
      netGroundwaterAvailability: 0.24,
      annualExtraction: 0.02,
      irrigation: 0.22,
      industrial: 0.01,
      domestic: 0,
      totalAnnualExtraction: 0,
      stageOfExtraction: 0.01,
    },
    {
      slNo: 23,
      state: "Tamil Nadu",
      monsoonRecharge: 7.42,
      nonMonsoonRecharge: 10.18,
      totalAnnualRecharge: 1.2,
      totalNaturalDischarge: 2.71,
      netGroundwaterAvailability: 21.51,
      annualExtraction: 2.07,
      irrigation: 19.46,
      industrial: 13.51,
      domestic: 0.14,
      totalAnnualExtraction: 0.8,
      stageOfExtraction: 14.45,
    },
    {
      slNo: 24,
      state: "Telangana",
      monsoonRecharge: 6.76,
      nonMonsoonRecharge: 2.34,
      totalAnnualRecharge: 0.58,
      totalNaturalDischarge: 1.82,
      netGroundwaterAvailability: 11.5,
      annualExtraction: 1.15,
      irrigation: 10.35,
      industrial: 7.12,
      domestic: 0.18,
      totalAnnualExtraction: 1.45,
      stageOfExtraction: 10.87,
    },
    {
      slNo: 25,
      state: "Tripura",
      monsoonRecharge: 0.93,
      nonMonsoonRecharge: 0.14,
      totalAnnualRecharge: 0.09,
      totalNaturalDischarge: 0.19,
      netGroundwaterAvailability: 1.26,
      annualExtraction: 0.13,
      irrigation: 1.13,
      industrial: 0.05,
      domestic: 0.01,
      totalAnnualExtraction: 0.06,
      stageOfExtraction: 0.19,
    },
    {
      slNo: 26,
      state: "Uttar Pradesh",
      monsoonRecharge: 37.89,
      nonMonsoonRecharge: 13.63,
      totalAnnualRecharge: 3.27,
      totalNaturalDischarge: 10.63,
      netGroundwaterAvailability: 76.16,
      annualExtraction: 7.62,
      irrigation: 68.54,
      industrial: 42.51,
      domestic: 1.64,
      totalAnnualExtraction: 3.47,
      stageOfExtraction: 63.88,
    },
    {
      slNo: 27,
      state: "Uttarakhand",
      monsoonRecharge: 2.03,
      nonMonsoonRecharge: 0.62,
      totalAnnualRecharge: 0.21,
      totalNaturalDischarge: 0.53,
      netGroundwaterAvailability: 3.39,
      annualExtraction: 0.34,
      irrigation: 3.05,
      industrial: 0.72,
      domestic: 0.05,
      totalAnnualExtraction: 0.12,
      stageOfExtraction: 0.82,
    },
    {
      slNo: 28,
      state: "West Bengal",
      monsoonRecharge: 16.93,
      nonMonsoonRecharge: 5.59,
      totalAnnualRecharge: 1.49,
      totalNaturalDischarge: 4.51,
      netGroundwaterAvailability: 28.52,
      annualExtraction: 2.85,
      irrigation: 25.67,
      industrial: 9.18,
      domestic: 0.49,
      totalAnnualExtraction: 1.83,
      stageOfExtraction: 10.67,
    },
  ];
}

/**
 * Calculate overall statistics
 */
export function calculateStats(data: GroundwaterData[]): GroundwaterStats {
  const totalAvailability = data.reduce((sum, item) => sum + item.netGroundwaterAvailability, 0);
  const totalUtilization = data.reduce((sum, item) => sum + item.totalAnnualExtraction, 0);
  const averageExtraction = data.reduce((sum, item) => sum + item.stageOfExtraction, 0) / data.length;
  
  const criticalStates = data
    .filter(item => item.stageOfExtraction > 70)
    .map(item => item.state);
  
  const safeStates = data
    .filter(item => item.stageOfExtraction < 40)
    .map(item => item.state);
  
  return {
    totalAvailability,
    totalUtilization,
    averageExtraction,
    criticalStates,
    safeStates,
  };
}

/**
 * Get state-specific data
 */
export function getStateData(data: GroundwaterData[], stateName: string): GroundwaterData | null {
  return data.find(item => item.state.toLowerCase() === stateName.toLowerCase()) || null;
}

/**
 * Get top states by availability
 */
export function getTopStatesByAvailability(data: GroundwaterData[], limit: number = 10): GroundwaterData[] {
  return [...data]
    .sort((a, b) => b.netGroundwaterAvailability - a.netGroundwaterAvailability)
    .slice(0, limit);
}

/**
 * Get states by extraction stage
 */
export function getStatesByExtractionStage(data: GroundwaterData[]): {
  critical: GroundwaterData[];
  overExploited: GroundwaterData[];
  semiCritical: GroundwaterData[];
  safe: GroundwaterData[];
} {
  return {
    critical: data.filter(item => item.stageOfExtraction > 90),
    overExploited: data.filter(item => item.stageOfExtraction > 70 && item.stageOfExtraction <= 90),
    semiCritical: data.filter(item => item.stageOfExtraction > 40 && item.stageOfExtraction <= 70),
    safe: data.filter(item => item.stageOfExtraction <= 40),
  };
}