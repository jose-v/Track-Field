// Follow this setup guide to integrate the Deno runtime: https://deno.land/manual/examples/supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get the request body
    const { prompt, model = "gpt-4", max_tokens = 150, temperature = 0.7 } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Make the request to OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a Track & Field assistant helping athletes." },
          { role: "user", content: prompt }
        ],
        max_tokens,
        temperature,
      }),
    });
    
    const responseData = await openaiResponse.json();
    
    if (openaiResponse.status !== 200) {
      return new Response(
        JSON.stringify({ 
          error: "Error from OpenAI API", 
          details: responseData
        }),
        { status: openaiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Return the response
    return new Response(
      JSON.stringify({ 
        response: responseData.choices[0].message.content 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}); 