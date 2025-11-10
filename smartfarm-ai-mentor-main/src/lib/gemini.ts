const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

const isPlaceholderKey = GEMINI_API_KEY === "your_gemini_api_key_here" || !GEMINI_API_KEY || GEMINI_API_KEY.trim() === "";

if (isPlaceholderKey) {
  console.warn("⚠️ VITE_GEMINI_API_KEY is not configured. Please add your Gemini API key to the .env file.");
  console.warn("Get your API key from: https://aistudio.google.com/app/apikey");
}

interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

export async function callGeminiAPI(
  prompt: string,
  systemInstruction?: string,
  imageBase64?: string
): Promise<string> {
  if (isPlaceholderKey) {
    throw new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file. Get your key from https://aistudio.google.com/app/apikey");
  }

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.split(",")[1] || imageBase64, // Remove data:image/jpeg;base64, prefix if present
      },
    });
  }

  parts.push({ text: prompt });

  const requestBody: any = {
    contents: [
      {
        parts,
      },
    ],
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini API");
  }

  return text;
}

export async function callGeminiWithFunctionCalling(
  prompt: string,
  systemInstruction: string,
  functionSchema: any,
  functionName: string
): Promise<any> {
  if (isPlaceholderKey) {
    throw new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file. Get your key from https://aistudio.google.com/app/apikey");
  }

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    tools: [
      {
        functionDeclarations: [functionSchema],
      },
    ],
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const functionCall = data.candidates?.[0]?.content?.parts?.[0]?.functionCall;

  if (!functionCall || functionCall.name !== functionName) {
    // If no function call, try to parse JSON from text response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Continue to throw error
        }
      }
    }
    throw new Error("No function call in response");
  }

  return functionCall.args;
}

export async function getWeatherData(location: string): Promise<any> {
  const systemInstruction = `You are a weather data provider. Given a location, provide realistic and current weather data in JSON format with the following structure:
{
  "location": "city name",
  "temperature": number (in Celsius),
  "humidity": number (0-100),
  "rainfall": number (monthly mm),
  "sunshine": number (hours per day),
  "description": "weather description"
}

For Coimbatore, India: It's typically warm with moderate humidity. Temperature ranges 25-32°C, humidity 60-75%, and it's known for pleasant weather.`;

  const prompt = `Provide current, realistic weather data for ${location}. Consider the city's typical climate. For Coimbatore, India, provide data typical for this region. Return only valid JSON, no additional text.`;

  try {
    const response = await callGeminiAPI(prompt, systemInstruction);
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid JSON response");
  } catch (error) {
    // Fallback to Coimbatore-specific defaults
    const isCoimbatore = location.toLowerCase().includes("coimbatore");
    if (isCoimbatore) {
      return {
        location: "Coimbatore, India",
        temperature: 29,
        humidity: 68,
        rainfall: 35,
        sunshine: 9,
        description: "pleasant and partly cloudy",
      };
    }
    // Generic fallback
    return {
      location,
      temperature: 28,
      humidity: 65,
      rainfall: 45,
      sunshine: 8,
      description: "partly cloudy",
    };
  }
}

export async function predictCrops(data: {
  location: string;
  soilType: string;
  rainfall: string;
  temperature: string;
}): Promise<{ recommendations: any[] }> {
  const systemInstruction = `You are an expert agricultural AI that provides accurate crop recommendations based on environmental conditions. 
Analyze the provided data and recommend the top 3 most suitable and profitable crops.

For each crop, provide:
- name: The crop name
- expectedYield: Estimated yield (e.g., "2-3 tons per hectare")
- growthDuration: Time to harvest (e.g., "90-120 days")
- suitability: A percentage score (0-100)
- reason: A brief explanation of why this crop is suitable

Consider factors like climate suitability, soil type compatibility, water requirements, and market profitability.`;

  const prompt = `Location: ${data.location}
Soil Type: ${data.soilType}
Expected Rainfall: ${data.rainfall}mm
Average Temperature: ${data.temperature}°C

Please recommend the top 3 crops for these conditions. Return a JSON object with a "recommendations" array containing exactly 3 crop objects.`;

  const functionSchema = {
    name: "recommend_crops",
    description: "Recommend top 3 crops based on conditions",
    parameters: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              expectedYield: { type: "string" },
              growthDuration: { type: "string" },
              suitability: { type: "number" },
              reason: { type: "string" },
            },
            required: ["name", "expectedYield", "growthDuration", "suitability", "reason"],
          },
          minItems: 3,
          maxItems: 3,
        },
      },
      required: ["recommendations"],
    },
  };

  try {
    const result = await callGeminiWithFunctionCalling(
      prompt,
      systemInstruction,
      functionSchema,
      "recommend_crops"
    );
    return result;
  } catch (error) {
    console.error("Error calling Gemini for crop prediction:", error);
    // Fallback to direct API call
    try {
      const response = await callGeminiAPI(prompt, systemInstruction);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Ensure it has the recommendations array
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          return parsed;
        }
        // If it's just an array, wrap it
        if (Array.isArray(parsed)) {
          return { recommendations: parsed };
        }
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
    }
    throw error;
  }
}

export async function analyzePlantDisease(imageBase64: string): Promise<any> {
  const systemInstruction = `You are an expert plant pathologist AI that analyzes plant images to detect diseases and nutrient deficiencies.

Analyze the provided plant image and provide a JSON response with:
- disease: Name of the disease or issue (or "Healthy" if no issues detected)
- confidence: Confidence level as a percentage (0-100)
- severity: "Low", "Medium", or "High"
- remedy: Detailed treatment recommendation
- preventiveMeasures: Array of 3-5 preventive measures as strings

Be specific and actionable in your recommendations. Return ONLY valid JSON, no additional text.`;

  const prompt = "Analyze this plant image and provide a detailed diagnosis in JSON format.";

  const functionSchema = {
    name: "analyze_plant_health",
    description: "Analyze plant health and provide diagnosis",
    parameters: {
      type: "object",
      properties: {
        disease: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 100 },
        severity: { type: "string", enum: ["Low", "Medium", "High"] },
        remedy: { type: "string" },
        preventiveMeasures: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 5,
        },
      },
      required: ["disease", "confidence", "severity", "remedy", "preventiveMeasures"],
    },
  };

  try {
    const result = await callGeminiWithFunctionCalling(
      prompt,
      systemInstruction,
      functionSchema,
      "analyze_plant_health"
    );
    return result;
  } catch (error) {
    console.error("Error calling Gemini for disease analysis:", error);
    // Fallback to direct API call with image
    try {
      const response = await callGeminiAPI(prompt, systemInstruction, imageBase64);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
    }
    throw error;
  }
}

export async function chatWithFarmingAssistant(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const systemInstruction = `You are SmartFarm AI Assistant, an expert agricultural advisor with deep knowledge of:
- Crop selection and rotation strategies
- Soil health and fertilizer management
- Pest and disease control methods
- Weather patterns and seasonal planning
- Market trends and pricing
- Sustainable farming practices
- Government schemes and subsidies for farmers

Provide clear, practical, and actionable advice to farmers. Be encouraging and supportive.
Keep responses concise but informative. Use simple language that farmers can understand.
When discussing chemicals or treatments, always prioritize eco-friendly and organic options first.`;

  // Build conversation context
  let conversationContext = "";
  if (history.length > 0) {
    conversationContext = history
      .slice(-5) // Last 5 messages for context
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n");
    conversationContext += `\n\nUser: ${message}`;
  } else {
    conversationContext = message;
  }

  return await callGeminiAPI(conversationContext, systemInstruction);
}

