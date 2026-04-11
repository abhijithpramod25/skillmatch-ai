import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { ZipReader, BlobReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.29/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function extractDocxText(base64: string): Promise<string> {
  const bytes = decodeBase64(base64);
  const blob = new Blob([bytes]);
  const reader = new ZipReader(new BlobReader(blob));
  const entries = await reader.getEntries();
  let text = "";
  for (const entry of entries) {
    if (entry.filename === "word/document.xml" && entry.getData) {
      const writer = new TextWriter();
      const xml = await entry.getData(writer);
      // Strip XML tags, keep text
      text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }
  await reader.close();
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { file_base64, file_name, file_type, job_description, job_title } = await req.json();

    if (!file_base64 || !job_description) {
      return new Response(JSON.stringify({ error: "Missing file or job description" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isPdf = file_type === "application/pdf" || file_name?.toLowerCase().endsWith(".pdf");

    const systemPrompt = `You are an expert recruiter AI. You will receive a resume and a job description. Analyze the resume against the job description and return a structured JSON response.

CRITICAL INSTRUCTIONS:
- Extract the EXACT name, email, education, and experience as written in the resume. Do NOT fabricate or guess any details.
- If a field is not found in the resume, use "Not found" for strings and 0 for numbers.
- The score should reflect how well the candidate matches the job description requirements.

You MUST respond with ONLY a valid JSON object using the tool call format. Do not add any extra text.`;

    const jobContext = `Job Title: ${job_title || "Not specified"}\n\nJob Description:\n${job_description}\n\nResume file name: ${file_name}\n\nAnalyze this resume against the job description. Extract the EXACT candidate details from the resume.`;

    // Build user message content
    let userContent: any;

    if (isPdf) {
      // Multimodal: send PDF as inline data so the model can read it
      userContent = [
        {
          type: "image_url",
          image_url: {
            url: `data:application/pdf;base64,${file_base64}`,
          },
        },
        {
          type: "text",
          text: jobContext,
        },
      ];
    } else {
      // DOCX: extract text first
      const resumeText = await extractDocxText(file_base64);
      if (!resumeText) {
        throw new Error("Could not extract text from DOCX file");
      }
      userContent = `${jobContext}\n\nResume Content:\n${resumeText}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_resume",
              description: "Return structured resume analysis results",
              parameters: {
                type: "object",
                properties: {
                  candidate: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Candidate full name extracted EXACTLY from resume" },
                      email: { type: "string", description: "Candidate email extracted EXACTLY from resume" },
                      score: { type: "number", description: "Match score 0-100 based on job description fit" },
                      skills_matched: { type: "array", items: { type: "string" }, description: "Skills from the job description found in the resume" },
                      skills_missing: { type: "array", items: { type: "string" }, description: "Required skills from job description NOT found in resume" },
                      experience_years: { type: "number", description: "Total years of relevant experience as stated in resume" },
                      education: { type: "string", description: "Highest education level and field as stated in resume" },
                      summary: { type: "string", description: "Brief 2-3 sentence summary of candidate profile" },
                      strengths: { type: "array", items: { type: "string" }, description: "3-5 key strengths relevant to the job" },
                      weaknesses: { type: "array", items: { type: "string" }, description: "2-4 areas where candidate may fall short" },
                      recommendation: { type: "string", description: "One paragraph recommendation: hire/consider/pass and why" },
                    },
                    required: ["name", "email", "score", "skills_matched", "skills_missing", "experience_years", "education", "summary", "strengths", "weaknesses", "recommendation"],
                  },
                },
                required: ["candidate"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_resume" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const analysisData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
