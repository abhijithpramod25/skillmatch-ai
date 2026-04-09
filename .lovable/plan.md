

# Generate Tools & Technologies Report (DOCX)

## What We're Building
A professional DOCX report documenting all tools, technologies, libraries, and frameworks used in the Resume Screening System project. The report will be well-structured with sections, tables, and descriptions suitable for academic or professional submission.

## Report Structure

1. **Title Page** — Project name, subtitle, date
2. **Table of Contents**
3. **Project Overview** — Brief description of the Resume Screening System
4. **Technology Stack** — Organized sections:
   - Frontend (React 18, TypeScript 5, Vite 5, Tailwind CSS v3)
   - UI Components (shadcn/ui, Radix UI, Lucide React, Recharts)
   - State Management & Data (Zustand, TanStack React Query)
   - Animations (Framer Motion)
   - Backend & Cloud (Lovable Cloud/Supabase, Deno Edge Functions)
   - AI & NLP (Google Gemini 2.5 Flash, Lovable AI Gateway)
   - Notifications (Sonner)
   - Dev Tools (Bun, Vitest, Playwright, ESLint)
5. **Architecture Summary** — Brief text description of how layers connect
6. **Summary Table** — Category | Technology | Version | Purpose

## Technical Approach
- Use `docx` (npm) JS library to generate a styled DOCX
- Professional fonts (Arial), heading styles, formatted tables with borders and shading
- Output to `/mnt/documents/tools_and_technologies_report.docx`
- QA via LibreOffice PDF conversion and visual inspection

