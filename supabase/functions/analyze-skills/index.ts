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
    const { skills } = await req.json();

    const MAX_SKILLS = 50;
    const MAX_SKILL_LEN = 100;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return new Response(JSON.stringify({ error: "Skills are required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (skills.length > MAX_SKILLS) {
      return new Response(JSON.stringify({ error: `Too many skills (max ${MAX_SKILLS}).` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const safeSkills = skills
      .filter((s: unknown) => typeof s === 'string')
      .map((s: string) => s.slice(0, MAX_SKILL_LEN));
    if (safeSkills.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid skills format." }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error("Missing AI configuration");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert career advisor and job market analyst. Based on a user's skills, you will:
1. Identify 10-15 job roles they are qualified for
2. Provide match percentages for each role
3. List required vs missing skills for each role
4. Generate a personalized learning roadmap
5. Suggest additional skills that would increase their marketability

Be specific about job titles and realistic about match percentages based on the skills provided.`;

    const userPrompt = `Based on these skills: ${safeSkills.join(', ')}

Analyze and provide job recommendations and a learning path. Respond in JSON format:
{
  "jobMatches": [
    {
      "title": "Job Title",
      "company": "Example Company Name",
      "match": 85,
      "required": ["skill1", "skill2"],
      "missing": ["skill3"],
      "salaryRange": "$100K - $130K",
      "demandLevel": "High" | "Medium" | "Low"
    }
  ],
  "learningPath": [
    {
      "skill": "Skill Name",
      "priority": "High" | "Medium" | "Low",
      "duration": "X weeks",
      "reason": "Why this skill is important",
      "resources": ["Recommended resource 1", "Recommended resource 2"]
    }
  ],
  "skillGaps": ["list of critical skills the user is missing"],
  "strengths": ["list of strong skills the user has"],
  "careerAdvice": "Personalized career advice based on their skill set"
}

Provide at least 10 job matches and 5 learning path items.`;

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
      
      return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("Empty AI response");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again." }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = JSON.parse(content);
    
    console.log("Skills analysis completed successfully");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in analyze-skills function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
