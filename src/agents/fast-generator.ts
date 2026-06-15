/**
 * Fast Generator - Gera estrutura COMPLETA estilo AI Studio
 *
 * Estratégia inteligente baseada na complexidade do prompt:
 * - Prompt < 300 chars: 1 chamada LLM (rápido, ~15-20s)
 * - Prompt >= 300 chars: 2 chamadas paralelas via Promise.all
 *   - Boilerplate (package.json, vite.config, tsconfig, index.html, main.tsx) ~10-15s
 *   - App Code (index.css + App.tsx) ~20-30s
 *   - Total em paralelo: ~30s (cabe no timeout de 60s do Vercel)
 *
 * Usa Haiku 4.5 (rápido e barato).
 */
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';

export interface FastGenResult {
  success: boolean;
  files: Record<string, string>;
  specification: string;
  error?: string;
  durationMs?: number;
  mode?: 'single' | 'parallel';
}

export interface GenEvent {
  type: 'thinking' | 'planning' | 'connecting' | 'generating' | 'file' | 'parsing' | 'done' | 'error' | 'batch_start';
  message?: string;
  file?: string;
  index?: number;
  total?: number;
  files?: Record<string, string>;
  durationMs?: number;
  error?: string;
  batch?: 'boilerplate' | 'app';
}

const COMPLEXITY_THRESHOLD = 300;

// ============================================================
// PROMPTS
// ============================================================

const SINGLE_SYSTEM_PROMPT = `You are an elite full-stack developer building Vite + React + TypeScript SPAs (like Google AI Studio, Vercel, Linear).

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

const BOILERPLATE_SYSTEM_PROMPT = `You are a Vite + React + TypeScript scaffolding expert.

Generate ONLY the boilerplate files for a Vite + React 18 + TypeScript + Tailwind project.

OUTPUT FORMAT: A single JSON object (NO markdown, NO fences):
{
  "files": {
    "package.json": "...",
    "vite.config.ts": "...",
    "tsconfig.json": "...",
    "tsconfig.node.json": "...",
    "index.html": "...",
    "src/main.tsx": "..."
  }
}

🚨 RULES:
1. Generate EXACTLY these 6 files (no more, no less)
2. package.json must include: react@^18, react-dom@^18, lucide-react, tailwindcss, vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom
3. vite.config.ts must use @vitejs/plugin-react
4. tsconfig.json must extend tsconfig.node.json and have jsx: "react-jsx"
5. index.html must have <div id="root"></div> and reference /src/main.tsx
6. src/main.tsx must render <App /> from "./App.tsx" into #root using ReactDOM.createRoot
7. Make the index.html <title> and meta description match the app being built
8. ALL string values: use double quotes, escape newlines as \\n and quotes as \\"
9. Be CONCISE — these are templates, keep them tight`;

const APP_CODE_SYSTEM_PROMPT = `You are an elite full-stack developer building Vite + React + TypeScript SPAs (like Google AI Studio, Vercel, Linear).

Generate ONLY the application code files: the CSS styles and the main App component with ALL components inline.

OUTPUT FORMAT: A single JSON object (NO markdown, NO fences):
{
  "files": {
    "src/index.css": "...",
    "src/App.tsx": "..."
  }
}

🚨 CRITICAL RULES:
1. Generate EXACTLY these 2 files
2. src/index.css: Tailwind directives (@tailwind base/components/utilities) + custom CSS animations, gradients, scrollbar, etc. Include @import url for Google Fonts matching the theme.
3. src/App.tsx: MAIN APP CODE - put ALL components INLINE as separate functions (Header, Hero, Features, Products, Pricing, Stats, CTA, Footer, etc) plus a default exported \`App\` component that uses them
4. Use Vite + React 18 + TypeScript with Tailwind CSS
5. Use lucide-react for icons (we stub these to emoji automatically)
6. The App component should import { useState } from 'react' if needed
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
9. ALL string values: use double quotes, escape newlines as \\n and quotes as \\"`;

// ============================================================
// JSON EXTRACTION
// ============================================================

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

// ============================================================
// HELPERS
// ============================================================

function buildSystemPrompt(base: string, themePrompt?: string): string {
  return themePrompt
    ? `${base}\n\n🎨 DESIGN THEME:\n${themePrompt}`
    : base;
}

function validatePath(path: string): boolean {
  return /^[a-zA-Z0-9\-_./]+$/.test(path);
}

async function emitFiles(
  files: Record<string, string>,
  emit: (e: GenEvent) => void
): Promise<string[]> {
  const entries = Object.entries(files);
  const valid: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const [path, val] = entries[i];
    if (typeof val === 'string' && val.length > 10 && validatePath(path)) {
      valid.push(path);
      emit({ type: 'file', file: path, index: i + 1, total: entries.length });
      await new Promise(r => setTimeout(r, 30));
    }
  }
  return valid;
}

// ============================================================
// MODE 1: SINGLE CALL (prompts < 300 chars)
// ============================================================

async function generateSingle(
  userPrompt: string,
  themePrompt: string | undefined,
  emit: (e: GenEvent) => void,
  start: number
): Promise<FastGenResult> {
  const systemPrompt = buildSystemPrompt(SINGLE_SYSTEM_PROMPT, themePrompt);
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Build this complete app: ${userPrompt}\n\nGenerate ALL necessary files for a production-ready Vite + React + TypeScript app with stunning cinematic UI.` },
  ];

  emit({ type: 'planning', message: 'Planejando arquitetura completa...' });
  emit({ type: 'connecting', message: 'Conectando ao Claude (Haiku 4.5)...' });
  emit({ type: 'generating', message: 'Gerando código completo (pode levar 30-60s)...' });

  const response = await callLLM(messages, MODELS.HAIKU, 16000);
  const content = response.content.trim();
  console.log(`[FastGen:single] LLM ${Date.now() - start}ms | ${content.length} chars`);

  emit({ type: 'parsing', message: 'Processando resposta da IA...' });

  const parsed = extractJSON(content);
  if (parsed && parsed.files && typeof parsed.files === 'object') {
    const files: Record<string, string> = {};
    for (const [path, val] of Object.entries(parsed.files)) {
      if (typeof val === 'string' && val.length > 10 && validatePath(path)) {
        files[path] = val;
      }
    }
    const validPaths = await emitFiles(files, emit);
    if (validPaths.length > 0) {
      const duration = Date.now() - start;
      console.log(`[FastGen:single] ✓ ${validPaths.length} files in ${duration}ms`);
      emit({ type: 'done', files, durationMs: duration });
      return { success: true, files, specification: parsed.specification || userPrompt, durationMs: duration, mode: 'single' };
    }
  }

  emit({ type: 'error', error: 'IA respondeu, mas JSON inválido ou sem arquivos. Tente reformular.' });
  return { success: false, files: {}, specification: userPrompt, error: 'Invalid JSON or no files' };
}

// ============================================================
// MODE 2: PARALLEL CALLS (prompts >= 300 chars)
// ============================================================

async function generateBoilerplate(
  userPrompt: string,
  themePrompt: string | undefined,
  emit: (e: GenEvent) => void
): Promise<Record<string, string>> {
  const systemPrompt = buildSystemPrompt(BOILERPLATE_SYSTEM_PROMPT, themePrompt);
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Build boilerplate for: ${userPrompt}\n\nGenerate ONLY the 6 boilerplate files. The app will be: ${userPrompt.slice(0, 200)}` },
  ];

  const response = await callLLM(messages, MODELS.HAIKU, 4000);
  const content = response.content.trim();
  console.log(`[FastGen:boilerplate] LLM | ${content.length} chars`);

  const parsed = extractJSON(content);
  if (parsed && parsed.files && typeof parsed.files === 'object') {
    const files: Record<string, string> = {};
    for (const [path, val] of Object.entries(parsed.files)) {
      if (typeof val === 'string' && val.length > 10 && validatePath(path)) {
        files[path] = val;
      }
    }
    return files;
  }
  return {};
}

async function generateAppCode(
  userPrompt: string,
  themePrompt: string | undefined,
  emit: (e: GenEvent) => void
): Promise<Record<string, string>> {
  const systemPrompt = buildSystemPrompt(APP_CODE_SYSTEM_PROMPT, themePrompt);
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Build the application code for: ${userPrompt}\n\nGenerate the index.css with all custom styles + Google Fonts import, and App.tsx with ALL components INLINE (Header, Hero, Features, Products, Pricing, Stats, CTA, Footer, etc) as separate function components. Make it production-ready, cinematic, and use real Unsplash images.` },
  ];

  const response = await callLLM(messages, MODELS.HAIKU, 14000);
  const content = response.content.trim();
  console.log(`[FastGen:appcode] LLM | ${content.length} chars`);

  const parsed = extractJSON(content);
  if (parsed && parsed.files && typeof parsed.files === 'object') {
    const files: Record<string, string> = {};
    for (const [path, val] of Object.entries(parsed.files)) {
      if (typeof val === 'string' && val.length > 10 && validatePath(path)) {
        files[path] = val;
      }
    }
    return files;
  }
  return {};
}

async function generateParallel(
  userPrompt: string,
  themePrompt: string | undefined,
  emit: (e: GenEvent) => void,
  start: number
): Promise<FastGenResult> {
  emit({ type: 'planning', message: 'Prompt complexo detectado — dividindo em 2 chamadas paralelas...' });
  emit({ type: 'batch_start', batch: 'boilerplate', message: '⏳ Gerando boilerplate (package.json, vite.config, etc)...' });
  emit({ type: 'batch_start', batch: 'app', message: '⏳ Gerando App.tsx + CSS (parte pesada)...' });

  // Roda ambas em paralelo
  const [boilerplateFiles, appFiles] = await Promise.all([
    generateBoilerplate(userPrompt, themePrompt, emit).then(files => {
      emit({ type: 'parsing', message: '✓ Boilerplate pronto' });
      return files;
    }),
    generateAppCode(userPrompt, themePrompt, emit).then(files => {
      emit({ type: 'parsing', message: '✓ App code pronto' });
      return files;
    }),
  ]);

  // Merge
  const allFiles = { ...boilerplateFiles, ...appFiles };
  const validPaths = await emitFiles(allFiles, emit);

  if (validPaths.length === 0) {
    emit({ type: 'error', error: 'Nenhuma chamada retornou arquivos válidos. Tente reformular.' });
    return { success: false, files: {}, specification: userPrompt, error: 'No files from parallel calls' };
  }

  const duration = Date.now() - start;
  console.log(`[FastGen:parallel] ✓ ${validPaths.length} files in ${duration}ms (boilerplate: ${Object.keys(boilerplateFiles).length}, app: ${Object.keys(appFiles).length})`);
  emit({ type: 'done', files: allFiles, durationMs: duration });
  return { success: true, files: allFiles, specification: userPrompt, durationMs: duration, mode: 'parallel' };
}

// ============================================================
// MAIN ENTRY
// ============================================================

export async function fastGenerate(
  userPrompt: string,
  onEvent?: (e: GenEvent) => void,
  themePrompt?: string
): Promise<FastGenResult> {
  const emit = onEvent || (() => {});
  const start = Date.now();

  emit({ type: 'thinking', message: 'Analisando seu prompt...' });

  const isComplex = userPrompt.length >= COMPLEXITY_THRESHOLD;
  console.log(`[FastGen] prompt length: ${userPrompt.length} | mode: ${isComplex ? 'parallel' : 'single'}`);

  try {
    if (isComplex) {
      return await generateParallel(userPrompt, themePrompt, emit, start);
    }
    return await generateSingle(userPrompt, themePrompt, emit, start);
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
