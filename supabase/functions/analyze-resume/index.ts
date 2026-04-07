import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { file_base64, file_name, job_description, job_title } = await req.json();

    if (!file_base64 || !job_description) {
      return new Response(JSON.stringify({ error: "Missing file or job description" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert recruiter AI. You will receive a resume (as base64-encoded document content) and a job description. Analyze the resume against the job description and return a structured JSON response.

You MUST respond with ONLY a valid JSON object using this exact tool call format. Do not add any extra text.`;

    const userPrompt = `Job Title: ${job_title || "Not specified"}

Job Description:
${job_description}

Resume file name: ${file_name}
Resume content (base64): ${file_base64.substring(0, 50000)}

Analyze this resume against the job description. Extract candidate details and provide a match assessment.`;

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
          { role: "user", content: userPrompt },
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
                      name: { type: "string", description: "Candidate full name extracted from resume" },
                      email: { type: "string", description: "Candidate email" },
                      score: { type: "number", description: "Match score 0-100 based on job description fit" },
                      skills_matched: { type: "array", items: { type: "string" }, description: "Skills from the job description found in the resume" },
                      skills_missing: { type: "array", items: { type: "string" }, description: "Required skills from job description NOT found in resume" },
                      experience_years: { type: "number", description: "Total years of relevant experience" },
                      education: { type: "string", description: "Highest education level and field" },
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
