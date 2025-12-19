import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, fileName } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Document content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    console.log(`Parsing document: ${fileName}, content length: ${content.length}`);

    // Truncate content if too large (Perplexity has context limits)
    const maxContentLength = 15000;
    const truncatedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength) + "\n\n[Content truncated...]"
      : content;
    
    console.log(`Using content length: ${truncatedContent.length}`);

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

    // Create abort controller with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout

    console.log("Calling Perplexity API...");

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Parse the following document and extract all risk information:\n\n${truncatedContent}` }
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("Perplexity API response status:", response.status);

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const errorText = await response.text();
        console.error("Perplexity API error:", response.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: `AI processing error: ${response.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log("Perplexity response received");
      
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        console.error("No content in AI response:", JSON.stringify(data));
        throw new Error("No response from AI");
      }

      console.log("AI response length:", aiResponse.length);

      // Parse the JSON response - handle markdown code blocks
      let risks = [];
      try {
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
        
        risks = JSON.parse(jsonStr);
        
        // Ensure it's an array
        if (!Array.isArray(risks)) {
          risks = [risks];
        }
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        console.log("Raw AI response:", aiResponse.substring(0, 500));
        return new Response(
          JSON.stringify({ success: false, error: "Failed to parse AI response", rawResponse: aiResponse.substring(0, 500) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate and normalize each risk
      const normalizedRisks = risks.map((risk: any, index: number) => ({
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

      console.log(`Successfully parsed ${normalizedRisks.length} risks`);

      return new Response(
        JSON.stringify({ success: true, risks: normalizedRisks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("Request timed out");
        return new Response(
          JSON.stringify({ success: false, error: "Request timed out. Please try with a smaller document." }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    console.error("Error parsing document:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
