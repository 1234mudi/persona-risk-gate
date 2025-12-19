import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a risk assessment document parser. Your job is to extract risk information from documents in any format (CSV, tables, free text, etc).

Extract ALL risks found in the document. For each risk, extract the following fields:
- id: A unique identifier (e.g., "R-001", "RISK-1", or generate one like "R-001" if not present)
- title: The name/title of the risk
- riskLevel1: Top-level risk category (e.g., "Operational", "Financial", "Strategic", "Compliance")
- riskLevel2: Second-level risk category (subcategory)
- riskLevel3: Third-level risk category (more specific subcategory)
- level: Risk level or tier
- businessUnit: The business unit or department
- category: Risk category
- owner: The risk owner's name
- assessor: The person who assessed the risk
- inherentRisk: Inherent risk level (e.g., "High", "Medium", "Low", or a number)
- inherentTrend: Trend direction (e.g., "↑", "↓", "→", "Increasing", "Decreasing", "Stable")
- controls: Description of controls in place
- effectiveness: Control effectiveness (e.g., "Effective", "Partially Effective", "Ineffective")
- testResults: Results of control testing
- residualRisk: Residual risk level after controls
- residualTrend: Residual risk trend direction
- status: Current status (e.g., "Active", "Under Review", "Closed", "Open")
- lastAssessed: Last assessment date

Important rules:
1. Extract ALL risks you can find, even if some fields are missing
2. Use empty string "" for any field you cannot determine
3. Be flexible with field names - documents may use different column names
4. If the document has tables, parse all rows as separate risks
5. Generate sequential IDs if none are present (R-001, R-002, etc.)
6. Normalize risk levels to "High", "Medium", "Low" when possible
7. For trends, use symbols (↑, ↓, →) or words (Increasing, Decreasing, Stable)

Return ONLY valid JSON array of risk objects, no markdown, no explanation.`;

async function callLovableAI(content: string, apiKey: string, signal: AbortSignal) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse the following document and extract all risk information:\n\n${content}` }
      ],
    }),
    signal,
  });
  return response;
}

async function callPerplexityAI(content: string, apiKey: string, signal: AbortSignal) {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse the following document and extract all risk information:\n\n${content}` }
      ],
    }),
    signal,
  });
  return response;
}

function parseAIResponse(aiResponse: string): any[] {
  let jsonStr = aiResponse.trim();
  // Remove markdown code blocks if present
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();
  
  let risks = JSON.parse(jsonStr);
  
  // Ensure it's an array
  if (!Array.isArray(risks)) {
    risks = [risks];
  }
  return risks;
}

function normalizeRisks(risks: any[]): any[] {
  return risks.map((risk: any, index: number) => ({
    id: risk.id || `R-${String(index + 1).padStart(3, '0')}`,
    title: risk.title || "",
    riskLevel1: risk.riskLevel1 || "",
    riskLevel2: risk.riskLevel2 || "",
    riskLevel3: risk.riskLevel3 || "",
    level: risk.level || "",
    businessUnit: risk.businessUnit || "",
    category: risk.category || "",
    owner: risk.owner || "",
    assessor: risk.assessor || "",
    inherentRisk: risk.inherentRisk || "",
    inherentTrend: risk.inherentTrend || "",
    controls: risk.controls || "",
    effectiveness: risk.effectiveness || "",
    testResults: risk.testResults || "",
    residualRisk: risk.residualRisk || "",
    residualTrend: risk.residualTrend || "",
    status: risk.status || "",
    lastAssessed: risk.lastAssessed || "",
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, fileName, usePerplexity } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Document content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!LOVABLE_API_KEY && !PERPLEXITY_API_KEY) {
      throw new Error("No AI API key is configured");
    }

    console.log(`Parsing document: ${fileName}, content length: ${content.length}`);

    // Truncate content if too large
    const maxContentLength = 15000;
    const truncatedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength) + "\n\n[Content truncated...]"
      : content;
    
    console.log(`Using content length: ${truncatedContent.length}`);

    // Create abort controller with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout

    let response: Response | null = null;

    // If usePerplexity flag is set, skip Lovable AI and go directly to Perplexity
    if (usePerplexity && PERPLEXITY_API_KEY) {
      console.log("Using Perplexity AI (user confirmed fallback)...");
      response = await callPerplexityAI(truncatedContent, PERPLEXITY_API_KEY, controller.signal);
      console.log("Perplexity response status:", response.status);
    } else if (LOVABLE_API_KEY) {
      // Try Lovable AI first
      console.log("Calling Lovable AI Gateway...");
      try {
        response = await callLovableAI(truncatedContent, LOVABLE_API_KEY, controller.signal);
        console.log("Lovable AI response status:", response.status);

        // If 402 (credits exhausted) or 429 (rate limit), return immediately to show popup
        if (response.status === 402 || response.status === 429) {
          clearTimeout(timeoutId);
          const errorCode = response.status;
          const errorMessage = errorCode === 402 
            ? "Lovable AI credits exhausted" 
            : "Lovable AI rate limited";
          
          console.log(`${errorMessage}, requesting user confirmation for Perplexity fallback...`);
          
          // Check if Perplexity is available
          if (PERPLEXITY_API_KEY) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                needsFallback: true,
                fallbackReason: `${errorCode}: ${errorMessage}`,
                hasPerplexityKey: true
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            // No Perplexity key available
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `${errorMessage}. No backup AI provider configured.`
              }),
              { status: errorCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (lovableError) {
        console.error("Lovable AI error:", lovableError);
        clearTimeout(timeoutId);
        if (PERPLEXITY_API_KEY) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              needsFallback: true,
              fallbackReason: "Lovable AI connection error",
              hasPerplexityKey: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw lovableError;
        }
      }
    } else if (PERPLEXITY_API_KEY) {
      // No Lovable key, use Perplexity directly
      console.log("Calling Perplexity API (no Lovable key configured)...");
      response = await callPerplexityAI(truncatedContent, PERPLEXITY_API_KEY, controller.signal);
    }

    clearTimeout(timeoutId);

    if (!response) {
      throw new Error("No AI response received");
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded on all AI providers. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI usage limit reached on all providers. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `AI processing error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("AI response received");
    
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error("No content in AI response:", JSON.stringify(data));
      throw new Error("No response from AI");
    }

    console.log("AI response length:", aiResponse.length);

    // Parse the JSON response
    let risks = [];
    try {
      risks = parseAIResponse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.log("Raw AI response:", aiResponse.substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI response", rawResponse: aiResponse.substring(0, 500) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedRisks = normalizeRisks(risks);
    console.log(`Successfully parsed ${normalizedRisks.length} risks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        risks: normalizedRisks
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("Request timed out");
      return new Response(
        JSON.stringify({ success: false, error: "Request timed out. Please try with a smaller document." }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.error("Error parsing document:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
