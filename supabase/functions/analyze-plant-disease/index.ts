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
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert plant pathologist AI that analyzes plant images to detect diseases and nutrient deficiencies.
    
    Analyze the provided plant image and provide:
    - disease: Name of the disease or issue (or "Healthy" if no issues detected)
    - confidence: Confidence level as a percentage (0-100)
    - severity: "Low", "Medium", or "High"
    - remedy: Detailed treatment recommendation
    - preventiveMeasures: Array of 3-5 preventive measures
    
    Be specific and actionable in your recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: systemPrompt + "\n\nAnalyze this plant image:" },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        tools: [{
          type: "function",
          function: {
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
                  maxItems: 5
                }
              },
              required: ["disease", "confidence", "severity", "remedy", "preventiveMeasures"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_plant_health" } }
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