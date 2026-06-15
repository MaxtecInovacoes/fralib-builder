/**
 * Fast Generator - Planner + Coder em UMA chamada
 *
 * Estratégia: 1 prompt = 1-3 arquivos essenciais (app/page.tsx, app/layout.tsx, app/globals.css)
 * Retorna em 5-10s, dentro do timeout do Vercel Hobby.
 */
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';

export interface FastGenResult {
  success: boolean;
  files: Record<string, string>;
  specification: string;
  error?: string;
}

const FAST_SYSTEM_PROMPT = `You are an expert full-stack developer building a Next.js 14+ App Router app.

Your job: take a user prompt and produce COMPLETE, RUNNABLE code in ONE response.

CRITICAL OUTPUT FORMAT (NO markdown fences, NO commentary outside JSON):
{
  "specification": "Brief description of the app",
  "files": {
    "app/page.tsx": "<complete file content with 'use client' and all imports>",
    "app/layout.tsx": "<complete file content with metadata and font setup>",
    "app/globals.css": "<complete CSS with custom styles and animations>"
  }
}

RULES:
- ALWAYS generate these 3 files: app/page.tsx, app/layout.tsx, app/globals.css
- All files must be COMPLETE - no placeholders, no "// rest of code here"
- Use TypeScript and 'use client' for interactive pages
- Use Tailwind CSS for styling (use arbitrary values like bg-[#0a0a0f] when needed)
- Use lucide-react for icons
- Make it visually stunning: gradients, modern typography, hover effects, smooth animations
- The app/page.tsx must include everything inline: header, hero, features, CTA, footer
- Use export default function
- ALL string values in JSON must use double quotes, escape newlines as \\n and quotes as \\\"

The page should be self-contained and beautiful. Quality > quantity of files.`;

/**
 * Extrai JSON de uma resposta
 */
function extractJSON(text: string): any {
  // Tenta direto
  try { return JSON.parse(text); } catch {}

  // Tenta de markdown fence
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }

  // Tenta pegar objeto balanceado
  const start = text.indexOf('{');
  if (start !== -1) {
    let depth = 0, end = -1, inString = false, escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch {}
    }
  }
  return null;
}

export async function fastGenerate(userPrompt: string): Promise<FastGenResult> {
  const messages: LLMMessage[] = [
    { role: 'system', content: FAST_SYSTEM_PROMPT },
    { role: 'user', content: `Build this app: ${userPrompt}` },
  ];

  try {
    // Usa Haiku por padrão (3-4x mais rápido que Sonnet, qualidade ainda ótima)
    const response = await callLLM(messages, MODELS.HAIKU, 6000);
    const content = response.content.trim();
    console.log(`[FastGen] Response: ${content.length} chars`);

    const parsed = extractJSON(content);
    if (parsed && parsed.files && typeof parsed.files === 'object') {
      const files: Record<string, string> = {};
      for (const [path, val] of Object.entries(parsed.files)) {
        if (typeof val === 'string' && val.length > 20 && /^[a-zA-Z0-9\-_./]+$/.test(path)) {
          files[path] = val;
        }
      }
      if (Object.keys(files).length > 0) {
        console.log(`[FastGen] ✓ ${Object.keys(files).length} files:`, Object.keys(files));
        return {
          success: true,
          files,
          specification: parsed.specification || userPrompt,
        };
      }
    }

    console.warn('[FastGen] Failed to extract files');
    return {
      success: false,
      files: {},
      specification: userPrompt,
      error: 'No files generated',
    };
  } catch (error) {
    console.error('[FastGen] Error:', error);
    return {
      success: false,
      files: {},
      specification: userPrompt,
      error: String(error),
    };
  }
}
