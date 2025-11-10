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
    const { location } = await req.json();
    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");

    if (!OPENWEATHER_API_KEY) {
      throw new Error("OPENWEATHER_API_KEY is not configured");
    }

    // Fetch weather data from OpenWeatherMap
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json();
      throw new Error(errorData.message || "Failed to fetch weather data");
    }

    const weatherData = await weatherResponse.json();

    // Fetch 5-day forecast for rainfall prediction
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    let monthlyRainfall = 0;
    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json();
      // Calculate estimated monthly rainfall from forecast
      monthlyRainfall = forecastData.list
        .slice(0, 40) // 5 days of data
        .reduce((acc: number, item: any) => acc + (item.rain?.["3h"] || 0), 0) * 6; // Multiply by 6 to estimate monthly
    }

    const result = {
      location: weatherData.name,
      country: weatherData.sys.country,
      temperature: Math.round(weatherData.main.temp),
      humidity: weatherData.main.humidity,
      rainfall: Math.round(monthlyRainfall),
      sunshine: Math.round((weatherData.sys.sunset - weatherData.sys.sunrise) / 3600), // hours
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      windSpeed: weatherData.wind.speed,
      pressure: weatherData.main.pressure,
      feelsLike: Math.round(weatherData.main.feels_like),
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Weather API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch weather data";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});