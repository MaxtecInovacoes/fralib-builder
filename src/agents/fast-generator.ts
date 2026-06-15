/**
 * Fast Generator - Gera estrutura COMPLETA estilo AI Studio
 *
 * Estratégia: 1 chamada LLM que retorna 10-15 arquivos organizados
 * - index.html, package.json, vite.config.ts (boilerplate)
 * - src/main.tsx, src/App.tsx, src/index.css
 * - src/components/* (Header, Hero, Features, etc)
 *
 * Usa Haiku (rápido). max_tokens MUITO alto (32k) pra caber tudo.
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

const FAST_SYSTEM_PROMPT = `You are an elite full-stack developer building Vite + React + TypeScript SPAs (like Google AI Studio, Vercel, Linear).

Generate a COMPLETE, RUNNABLE app in ONE response with MULTIPLE organized files.

OUTPUT FORMAT: A single JSON object (NO markdown, NO fences, NO commentary before/after):
{
  "specification": "Brief description",
  "files": {
    "package.json": "...",
    "index.html": "...",
    "vite.config.ts": "...",
    "tsconfig.json": "...",
    "src/main.tsx": "...",
    "src/index.css": "...",
    "src/App.tsx": "..."
  }
}

🚨 CRITICAL RULES:
1. You MUST generate these 7 files in EXACTLY this structure:
   - package.json
   - index.html
   - vite.config.ts
   - tsconfig.json
   - src/main.tsx
   - src/index.css
   - src/App.tsx (MAIN FILE - put ALL components INLINE in this file)
2. Each file MUST be COMPLETE - no placeholders, no "..."
3. Use Vite + React 18 + TypeScript
4. Use Tailwind CSS for styling
5. Use lucide-react for icons (we stub these to emoji)
6. The MAIN app code goes in src/App.tsx - include Header, Hero, Features, Footer ALL INLINE in this file as separate component functions
7. MAKE IT CINEMATIC AND STUNNING:
   - Full-viewport hero sections
   - Glassmorphism cards (backdrop-blur, bg-white/5)
   - Gradient backgrounds (bg-gradient-to-br from-X via-Y to-Z)
   - Floating elements, hover effects
   - High-quality typography
   - Responsive (mobile-first)
8. USE REAL IMAGES (no empty placeholders, no placehold.co):
   - Hero backgrounds: https://images.unsplash.com/photo-XXXXX?w=1920&q=80
   - Pick photo IDs that match the topic (e.g. coffee, gym, solar, restaurant)
   - Themed gallery: https://source.unsplash.com/1920x1080/?<keyword>,<keyword>
   - Card images: https://images.unsplash.com/photo-XXXXX?w=800&q=80
   - Avatars: https://i.pravatar.cc/200?img=N (1-70)
   - ALWAYS include 3-5 real images per page in hero + cards + gallery
9. ALL string values: use double quotes, escape newlines as \\n and quotes as \\"
10. The 7 files listed above are MANDATORY - don't skip any`;

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
  onEvent?: (e: GenEvent) => void,
  themePrompt?: string
): Promise<FastGenResult> {
  const emit = onEvent || (() => {});
  const start = Date.now();

  emit({ type: 'thinking', message: 'Analisando seu prompt...' });

  const systemPrompt = themePrompt
    ? `${FAST_SYSTEM_PROMPT}\n\n🎨 DESIGN THEME:\n${themePrompt}`
    : FAST_SYSTEM_PROMPT;

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Build this complete app: ${userPrompt}\n\nGenerate ALL necessary files for a production-ready Vite + React + TypeScript app with stunning cinematic UI.` },
  ];

  try {
    emit({ type: 'planning', message: 'Planejando arquitetura completa...' });
    emit({ type: 'connecting', message: 'Conectando ao Claude (Haiku 4.5)...' });
    emit({ type: 'generating', message: 'Gerando código completo (pode levar 30-60s)...' });

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
        if (typeof val === 'string' && val.length > 10 && /^[a-zA-Z0-9\-_./]+$/.test(path)) {
          files[path] = val;
          emit({ type: 'file', file: path, index: i + 1, total: allFiles.length });
          await new Promise(r => setTimeout(r, 50));
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
