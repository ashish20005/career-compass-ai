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
    const { resumeText, targetRole } = await req.json();
    
    if (!resumeText) {
      return new Response(JSON.stringify({ error: "Resume text is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert resume optimizer and career coach. Your job is to analyze resumes and provide:
1. An ATS (Applicant Tracking System) compatibility score from 0-100
2. A list of specific improvements made to the resume
3. An optimized version of the resume with better bullet points, action verbs, and quantifiable achievements
4. Suggestions for additional improvements

When optimizing:
- Use strong action verbs (Led, Developed, Implemented, Achieved, etc.)
- Add quantifiable metrics where possible (increased by X%, reduced by Y hours, etc.)
- Ensure proper formatting for ATS systems
- Match keywords for the target role if provided
- Keep content concise but impactful`;

    const userPrompt = `Please analyze and optimize this resume${targetRole ? ` for a ${targetRole} position` : ''}:

${resumeText}

Respond in JSON format with this structure:
{
  "atsScore": number (0-100),
  "scoreIncrease": number (percentage improvement),
  "improvements": [
    { "type": "success" | "warning", "text": "description of improvement" }
  ],
  "optimizedResume": "the full optimized resume text with improved bullet points",
  "keyChanges": ["list of key changes made"],
  "additionalSuggestions": ["list of additional suggestions for the candidate"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limits reached, please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content);
    
    console.log("Resume analysis completed successfully");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in analyze-resume function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
