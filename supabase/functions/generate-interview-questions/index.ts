import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractText } from "https://esm.sh/unpdf@0.12.1?target=deno";
import mammoth from "npm:mammoth@1.8.0";
import { requireUser, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_CHARS = 45000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const stripDataUrl = (v: string) => (v.includes(",") ? v.split(",").pop() ?? "" : v);

const b64ToBytes = (b64: string) => {
  const bin = atob(stripDataUrl(b64).replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

const clean = (t: string) => t.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").trim();
const hasText = (t: string) => t.trim().length >= 80 && (t.match(/[a-zA-Z]/g)?.length ?? 0) >= 40;

async function extractPdfWithAi(b64: string, fileName: string, key: string) {
  const auth = await requireUser(req);
  if (!auth) return unauthorizedResponse(corsHeaders);

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Extract every readable line of text from this resume. Preserve headings and bullets." },
            { type: "file", file: { filename: fileName || "resume.pdf", file_data: `data:application/pdf;base64,${stripDataUrl(b64)}` } },
          ],
        }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return clean(data.choices?.[0]?.message?.content ?? "");
  } catch {
    return "";
  }
}

async function extractResume(b64: string, fileType: string, fileName: string, key: string): Promise<string> {
  const bytes = b64ToBytes(b64);
  if (bytes.byteLength > MAX_BYTES) throw new Error("File too large (max 10MB).");

  const isPdf = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const isDocx = fileName.toLowerCase().endsWith(".docx") || fileType.includes("officedocument.wordprocessingml");

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer: bytes });
    const text = clean(result.value ?? "");
    if (hasText(text)) return text.slice(0, MAX_CHARS);
    throw new Error("Could not read text from DOCX file.");
  }

  if (isPdf) {
    let text = "";
    try {
      const r = await extractText(bytes, { mergePages: true });
      text = clean(r.text ?? "");
    } catch { /* ignore */ }
    if (hasText(text)) return text.slice(0, MAX_CHARS);
    const aiText = await extractPdfWithAi(b64, fileName, key);
    if (hasText(aiText)) return aiText.slice(0, MAX_CHARS);
    throw new Error("Could not read text from PDF.");
  }

  // fallback: treat as plain text
  const text = clean(new TextDecoder().decode(bytes));
  if (hasText(text)) return text.slice(0, MAX_CHARS);
  throw new Error("Unsupported file type. Please upload PDF or DOCX.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) {
      console.error("Missing AI configuration");
      return json({ error: "Service temporarily unavailable. Please try again later." }, 503);
    }

    const body = await req.json();
    const fileBase64 = typeof body.fileBase64 === 'string' ? body.fileBase64 : '';
    const fileType = typeof body.fileType === 'string' ? body.fileType.slice(0, 200) : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName.slice(0, 300) : '';
    const resumeText = typeof body.resumeText === 'string' ? body.resumeText.slice(0, MAX_CHARS) : '';

    let text = clean(resumeText);
    if (!text && fileBase64) {
      text = await extractResume(fileBase64, fileType, fileName, KEY);
    }
    if (!hasText(text)) {
      return json({ error: "Please upload a valid resume (PDF, DOCX, or text)." }, 400);
    }

    const systemPrompt = `You are an expert technical interviewer and career coach. Given a candidate's resume, generate highly personalized interview questions that reference the candidate's actual skills, projects, internships, and tools. Questions must sound like real interviewers would ask, not generic textbook questions. Reference project names, technologies, and specifics from the resume wherever possible.`;

    const userPrompt = `Resume:\n${text}\n\nGenerate interview questions in 4 categories: technical, projects, experience (internship/work), behavioral (HR). For each category, produce 10 to 12 questions covering easy, medium, and hard difficulty. For project/experience questions, reference real project names and technologies from the resume.

Return strict JSON:
{
  "summary": {
    "skills": [string],
    "projects": [string],
    "experience": [string],
    "education": [string],
    "certifications": [string],
    "technologies": [string]
  },
  "categories": {
    "technical": [{ "question": string, "difficulty": "easy"|"medium"|"hard", "topic": string, "sampleAnswer": string }],
    "projects": [{ "question": string, "difficulty": "easy"|"medium"|"hard", "topic": string, "sampleAnswer": string }],
    "experience": [{ "question": string, "difficulty": "easy"|"medium"|"hard", "topic": string, "sampleAnswer": string }],
    "behavioral": [{ "question": string, "difficulty": "easy"|"medium"|"hard", "topic": string, "sampleAnswer": string }]
  }
}

The sampleAnswer should be a brief 2-3 sentence model answer outline.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("AI gateway error:", res.status, errText);
      if (res.status === 429) return json({ error: "Rate limits exceeded, please try again later." }, 429);
      if (res.status === 402) return json({ error: "Usage limits reached, please add credits." }, 402);
      return json({ error: "Service temporarily unavailable. Please try again later." }, 503);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("Empty AI response");
      return json({ error: "Service temporarily unavailable. Please try again." }, 503);
    }
    const parsed = JSON.parse(content);
    return json({ ...parsed, extractedText: text.slice(0, 2000) });
  } catch (e: unknown) {
    console.error("generate-interview-questions error:", e);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
