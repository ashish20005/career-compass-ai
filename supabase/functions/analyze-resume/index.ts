import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractText } from "https://esm.sh/unpdf@0.12.1?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_RESUME_CHARS = 45000;

interface AnalyzeResumePayload {
  resumeText?: string;
  targetRole?: string;
  fileBase64?: string;
  fileType?: string;
  fileName?: string;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const stripDataUrl = (value: string) => value.includes(',') ? value.split(',').pop() ?? '' : value;

const base64ToUint8Array = (base64: string) => {
  const binary = atob(stripDataUrl(base64).replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const cleanText = (text: string) => text.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').trim();

const hasMeaningfulText = (text: string) => {
  const letters = text.match(/[a-zA-Z]/g)?.length ?? 0;
  return text.trim().length >= 80 && letters >= 40;
};

async function extractPdfTextWithAi(pdfBase64: string, fileName: string, apiKey: string) {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract every readable line of text from this resume PDF. Return only the extracted resume text with headings and bullet points preserved.' },
              {
                type: 'file',
                file: {
                  filename: fileName || 'resume.pdf',
                  file_data: `data:application/pdf;base64,${stripDataUrl(pdfBase64)}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('PDF AI extraction failed:', response.status, await response.text());
      return '';
    }

    const data = await response.json();
    return cleanText(data.choices?.[0]?.message?.content ?? '');
  } catch (error) {
    console.error('PDF AI extraction error:', error);
    return '';
  }
}

async function extractPdfText(pdfBase64: string, fileName: string, apiKey: string) {
  const pdfBytes = base64ToUint8Array(pdfBase64);

  if (pdfBytes.byteLength > MAX_PDF_BYTES) {
    throw new Error('PDF is too large. Please upload a resume PDF under 10MB.');
  }

  let nativeText = '';
  try {
    const result = await extractText(pdfBytes, { mergePages: true });
    nativeText = cleanText(result.text ?? '');
    if (hasMeaningfulText(nativeText)) {
      return nativeText.slice(0, MAX_RESUME_CHARS);
    }
  } catch (error) {
    console.error('Native PDF text extraction failed:', error);
  }

  const aiExtractedText = await extractPdfTextWithAi(pdfBase64, fileName, apiKey);
  if (hasMeaningfulText(aiExtractedText)) {
    return aiExtractedText.slice(0, MAX_RESUME_CHARS);
  }

  return nativeText.slice(0, MAX_RESUME_CHARS);
}

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
