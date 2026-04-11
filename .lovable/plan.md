

# Fix: AI Returns Wrong Candidate Details

## Problem
The edge function pastes raw base64 as text into the prompt. The AI model cannot read base64-encoded PDF/DOCX content — it sees meaningless characters and **hallucinates** the candidate's name, email, and experience.

## Solution
Update the edge function to send resume content in a way the AI can actually read:

1. **For PDF files**: Send as a proper multimodal content part using Gemini's support for inline document data (base64 + mime type), so the model can actually read the PDF.
2. **For DOCX files**: Parse the DOCX XML on the server side to extract plain text, then include that text in the prompt.

## Changes

### File: `supabase/functions/analyze-resume/index.ts`

- Accept `file_type` from the request body (already sent by the frontend)
- **PDF path**: Structure the user message as a multimodal content array with the PDF as an `image_url` data URI (Gemini via OpenAI-compatible API supports PDF this way)
- **DOCX path**: Decode the base64, unzip the DOCX (which is a ZIP of XML files), extract text from `word/document.xml` by stripping XML tags
- Send the extracted/attached content to the AI instead of raw base64 text
- Add explicit instructions in the prompt telling the AI to extract the **exact** name and email from the resume, not guess or fabricate them

### No frontend changes needed
The frontend already sends `file_type` in the request body.

## Why This Fixes It
The AI will receive actual readable content (either a properly attached PDF or extracted DOCX text), enabling it to accurately extract the real candidate name, email, and experience from the resume.

