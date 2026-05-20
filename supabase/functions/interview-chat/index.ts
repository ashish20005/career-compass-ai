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
    const { messages, interviewType, action, resumeContext } = await req.json();

    const MAX_MESSAGES = 30;
    const MAX_MESSAGE_LEN = 4000;
    const MAX_RESUME_CTX = 20000;
    const MAX_TYPE_LEN = 100;

    if (messages && (!Array.isArray(messages) || messages.length > MAX_MESSAGES)) {
      return new Response(JSON.stringify({ error: "Invalid or too many messages." }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (!m || typeof m.content !== 'string' || m.content.length > MAX_MESSAGE_LEN) {
          return new Response(JSON.stringify({ error: "Invalid message content." }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }
    const safeResumeContext = typeof resumeContext === 'string' ? resumeContext.slice(0, MAX_RESUME_CTX) : '';
    const safeInterviewType = typeof interviewType === 'string' ? interviewType.slice(0, MAX_TYPE_LEN) : 'general';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error("Missing AI configuration");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resumeBlock = safeResumeContext
      ? `\n\nYou MUST ground every question in the candidate's actual resume below. Reference specific projects, technologies, internships, and skills by name. Do NOT ask generic questions that are not connected to this resume.\n\n--- CANDIDATE RESUME ---\n${safeResumeContext}\n--- END RESUME ---\n`
      : "";

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'start') {
      systemPrompt = `You are an expert interview coach conducting a personalized ${safeInterviewType} mock interview.${resumeBlock}

Your role is to:
1. Ask one question at a time, drawn directly from the candidate's resume (their projects, skills, technologies, internships, education)
2. Make the very first question specific to something concrete in their resume (name the project or technology)
3. Wait for the candidate's response, then give brief constructive feedback
4. Ask relevant follow-up questions tied to their background
5. Be encouraging but honest

Start by warmly welcoming the candidate by acknowledging one thing from their resume, then ask your first personalized question.`;

      userPrompt = `Please begin the interview now. Welcome me and ask your first question based on my resume.`;
    } else if (action === 'analyze') {
      systemPrompt = `You are an expert interview coach analyzing a candidate's interview performance.${resumeBlock}
Provide comprehensive, honest, and constructive feedback.`;

      const conversationHistory = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n');

      userPrompt = `Based on this interview conversation, provide a detailed analysis:

${conversationHistory}

Respond in JSON format:
{
  "overallScore": number (0-100),
  "confidenceScore": number (0-100),
  "communicationScore": number (0-100),
  "technicalScore": number (0-100),
  "strengths": ["strength1", "strength2", "strength3"],
  "areasToImprove": ["area1", "area2", "area3"],
  "detailedFeedback": "2-3 paragraph detailed feedback",
  "recommendedResources": ["resource1", "resource2"],
  "skillsToImprove": ["skill1", "skill2"]
}`;
    } else {
      systemPrompt = `You are an expert interview coach conducting a personalized ${interviewType} mock interview.${resumeBlock}

Your role is to:
1. Carefully read the candidate's last answer
2. Give brief constructive feedback (1-2 sentences)
3. Ask the NEXT question, which MUST be tied to a specific item from the resume above (project, technology, internship, skill). Never ask generic questions disconnected from the resume.
4. Be encouraging and professional
5. After 4-5 questions, offer to wrap up and provide overall feedback`;
    }

    const apiMessages = [
      { role: 'system', content: systemPrompt }
    ];

    if (action === 'start') {
      apiMessages.push({ role: 'user', content: userPrompt });
    } else if (action === 'analyze') {
      apiMessages.push({ role: 'user', content: userPrompt });
    } else if (messages && messages.length > 0) {
      // Add conversation history
      messages.forEach((m: any) => {
        apiMessages.push({ role: m.role, content: m.content });
      });
    }

    console.log(`Interview chat - Action: ${action}, Type: ${interviewType}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        ...(action === 'analyze' ? { response_format: { type: "json_object" } } : {})
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
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
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

    if (action === 'analyze') {
      const analysis = JSON.parse(content);
      console.log("Interview analysis completed");
      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Interview chat response generated");
    return new Response(JSON.stringify({ message: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in interview-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
