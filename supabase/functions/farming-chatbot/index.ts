// Chatbot function removed — neutral stub.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(() => new Response("Chatbot feature removed", {
  status: 404,
  headers: { "Content-Type": "text/plain" },
}));