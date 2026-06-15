/**
 * Fast Generator - Planner + Coder em UMA chamada
 *
 * Estratégia: 1 prompt = 3 arquivos essenciais (app/page.tsx, app/layout.tsx, app/globals.css)
 * Usa Haiku (rápido). max_tokens alto pra não truncar.
 *
 * Emite eventos de progresso via callback pra UI estilo Lovable.
 */
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';

export interface FastGenResult {
  success: boolean;
  files: Record<string, string>;
  specification: string;
  error?: string;
  durationMs?: number;
}

export interface GenEvent {
  type: 'thinking' | 'planning' | 'connecting' | 'generating' | 'file' | 'parsing' | 'done' | 'error';
  message?: string;
  file?: string;
  index?: number;
  total?: number;
  files?: Record<string, string>;
  durationMs?: number;
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

function extractJSON(text: string): any {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try { return JSON.parse(cleaned); } catch {}

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

  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  try { return JSON.parse(cleaned.slice(start, end + 1).replace(/[\x00-\x1f\x7f]/g, ' ')); } catch {}
  return null;
}

export async function fastGenerate(
  userPrompt: string,
  onEvent?: (e: GenEvent) => void
): Promise<FastGenResult> {
  const emit = onEvent || (() => {});
  const start = Date.now();

  emit({ type: 'thinking', message: 'Analisando seu prompt...' });

  const messages: LLMMessage[] = [
    { role: 'system', content: FAST_SYSTEM_PROMPT },
    { role: 'user', content: `Build this app: ${userPrompt}` },
  ];

  try {
    emit({ type: 'planning', message: 'Planejando estrutura do app...' });
    emit({ type: 'connecting', message: 'Conectando ao Claude (Haiku 4.5)...' });
    emit({ type: 'generating', message: 'Gerando código (pode levar 20-40s)...' });

    const response = await callLLM(messages, MODELS.HAIKU, 16000);
    const content = response.content.trim();
    const llmTime = Date.now() - start;
    console.log(`[FastGen] LLM ${llmTime}ms | ${content.length} chars`);

    emit({ type: 'parsing', message: 'Processando resposta da IA...' });

    const parsed = extractJSON(content);
    if (parsed && parsed.files && typeof parsed.files === 'object') {
      const allFiles = Object.entries(parsed.files);
      const files: Record<string, string> = {};
      for (let i = 0; i < allFiles.length; i++) {
        const [path, val] = allFiles[i];
        if (typeof val === 'string' && val.length > 20 && /^[a-zA-Z0-9\-_./]+$/.test(path)) {
          files[path] = val;
          // Emite evento pra cada arquivo
          emit({ type: 'file', file: path, index: i + 1, total: allFiles.length });
          // Pequeno delay pra UI mostrar progressão
          await new Promise(r => setTimeout(r, 100));
        }
      }
      if (Object.keys(files).length > 0) {
        const duration = Date.now() - start;
        console.log(`[FastGen] ✓ ${Object.keys(files).length} files in ${duration}ms`);
        emit({
          type: 'done',
          files,
          durationMs: duration,
        });
        return {
          success: true,
          files,
          specification: parsed.specification || userPrompt,
          durationMs: duration,
        };
      }
    }

    emit({ type: 'error', error: 'No files generated. Try a different prompt.' });
    return {
      success: false,
      files: {},
      specification: userPrompt,
      error: 'No files generated',
    };
  } catch (error) {
    const errMsg = String(error);
    console.error('[FastGen] Error:', errMsg);
    emit({ type: 'error', error: errMsg });
    return {
      success: false,
      files: {},
      specification: userPrompt,
      error: errMsg,
    };
  }
}
