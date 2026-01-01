import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, soilType, rainfall, temperature } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert agricultural AI that provides accurate crop recommendations based on environmental conditions. 
    Analyze the provided data and recommend the top 3 most suitable and profitable crops.
    
    For each crop, provide:
    - name: The crop name
    - expectedYield: Estimated yield (e.g., "2-3 tons per hectare")
    - growthDuration: Time to harvest (e.g., "90-120 days")
    - suitability: A percentage score (0-100)
    - reason: A brief explanation of why this crop is suitable
    
    Consider factors like climate suitability, soil type compatibility, water requirements, and market profitability.`;

    const userPrompt = `Location: ${location}
Soil Type: ${soilType}
Expected Rainfall: ${rainfall}mm
Average Temperature: ${temperature}°C

Please recommend the top 3 crops for these conditions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
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
                      reason: { type: "string" }
                    },
                    required: ["name", "expectedYield", "growthDuration", "suitability", "reason"]
                  },
                  minItems: 3,
                  maxItems: 3
                }
              },
              required: ["recommendations"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "recommend_crops" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});