/**
 * Fast Generator - Planner + Coder em UMA chamada
 *
 * Estratégia: 1 prompt = 3 arquivos essenciais (app/page.tsx, app/layout.tsx, app/globals.css)
 * Usa Haiku (rápido). max_tokens alto pra não truncar.
 */
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';

export interface FastGenResult {
  success: boolean;
  files: Record<string, string>;
  specification: string;
  error?: string;
}

const FAST_SYSTEM_PROMPT = `You build Next.js 14+ App Router apps. Generate COMPLETE, RUNNABLE code in ONE response.

OUTPUT: A single JSON object (NO markdown, NO fences, NO commentary before/after):
{
  "specification": "Brief description",
  "files": {
    "app/layout.tsx": "FULL file content as a string",
    "app/page.tsx": "FULL file content as a string",
    "app/globals.css": "FULL CSS as a string"
  }
}

CRITICAL RULES:
1. ALL 3 FILES MUST BE PRESENT in the response
2. Each file must be COMPLETE - no "// rest of code", no "..." placeholders
3. Use 'use client' in app/page.tsx (it's interactive)
4. Use Tailwind CSS for styling
5. Use lucide-react for icons (import from 'lucide-react')
6. app/page.tsx must include: Navbar, Hero, Features grid, Pricing or CTA, Footer - all inline
7. app/layout.tsx: import './globals.css', export metadata, RootLayout with html/body
8. app/globals.css: @tailwind directives, custom CSS variables, scrollbar styles
9. Make it visually stunning: gradients, hover effects, animations, modern typography
10. Use semantic colors (e.g., purple gradient for finance, blue for tech, etc.)
11. ALL string values: use double quotes, escape newlines as \\n and quotes as \\"`;

/**
 * Extrai JSON de uma resposta, lidando com markdown, texto extra, etc.
 */
function extractJSON(text: string): any {
  // Remove leading/trailing whitespace
  let cleaned = text.trim();

  // Remove markdown fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');

  // Tenta parse direto
  try { return JSON.parse(cleaned); } catch {}

  // Procura por um objeto JSON balanceado
  const start = cleaned.indexOf('{');
  if (start === -1) return null;

  let depth = 0, end = -1, inString = false, escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;

  const jsonStr = cleaned.slice(start, end + 1);
  try { return JSON.parse(jsonStr); } catch {}

  // Última tentativa: tenta limpar caracteres de controle
  try { return JSON.parse(jsonStr.replace(/[\x00-\x1f\x7f]/g, ' ')); } catch {}

  return null;
}

export async function fastGenerate(userPrompt: string): Promise<FastGenResult> {
  const messages: LLMMessage[] = [
    { role: 'system', content: FAST_SYSTEM_PROMPT },
    { role: 'user', content: `Build this app: ${userPrompt}` },
  ];

  try {
    const start = Date.now();
    const response = await callLLM(messages, MODELS.HAIKU, 16000);
    const content = response.content.trim();
    console.log(`[FastGen] ${Date.now() - start}ms | ${content.length} chars`);

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

    // Debug: mostra o que está chegando
    console.warn('[FastGen] Failed to extract. Content length:', content.length);
    console.warn('[FastGen] First 300:', content.slice(0, 300));
    console.warn('[FastGen] Last 300:', content.slice(-300));
    return {
      success: false,
      files: {},
      specification: userPrompt,
      error: 'No files generated. Try a different prompt.',
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
