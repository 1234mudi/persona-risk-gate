import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a risk management analyst writing executive summaries for a 2nd Line Risk Dashboard.
For each chart/metric provided, write a 2-3 sentence narrative that:
1. States the key finding or current state based on the data
2. Highlights any concerning trends or areas needing immediate attention
3. Provides actionable insight for leadership

Keep language professional, concise, and data-driven. Use specific numbers from the data provided.
Focus on risk implications and recommended actions.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dashboardData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating dashboard narratives for:", Object.keys(dashboardData));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate executive narratives for each of these dashboard components from a 2nd Line Risk Analyst dashboard. Each narrative should be specific to the data shown:\n\n${JSON.stringify(dashboardData, null, 2)}` 
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_narratives",
            description: "Return narratives for each dashboard chart/section",
            parameters: {
              type: "object",
              properties: {
                narratives: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      chartTitle: { type: "string", description: "The title of the chart/metric" },
                      narrative: { type: "string", description: "2-3 sentence analysis of the data" },
                      keyInsight: { type: "string", description: "Single sentence actionable insight" }
                    },
                    required: ["chartTitle", "narrative", "keyInsight"],
                    additionalProperties: false
                  }
                },
                executiveSummary: { 
                  type: "string", 
                  description: "3-4 sentence overall executive summary of the dashboard state" 
                }
              },
              required: ["narratives", "executiveSummary"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_narratives" } }
      }),
    });

    // Handle rate limits and errors
    if (response.status === 429) {
      console.error("Rate limit exceeded");
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (response.status === 402) {
      console.error("Payment required - credits exhausted");
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }
    
    const narratives = JSON.parse(toolCall.function.arguments);
    console.log("Narratives generated:", narratives.narratives?.length || 0);

    return new Response(
      JSON.stringify({ success: true, ...narratives }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error generating narratives:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
