/**
 * Debug do gerador real - mostra o que o LLM retorna com o prompt completo
 */
import { NextRequest } from 'next/server';
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

RULES:
1. Generate EXACTLY these 6 files (no more, no less)
2. package.json must include: react@^18, react-dom@^18, lucide-react, tailwindcss, vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom
3. vite.config.ts must use @vitejs/plugin-react
4. tsconfig.json must extend tsconfig.node.json and have jsx: "react-jsx"
5. index.html must have <div id="root"></div> and reference /src/main.tsx
6. src/main.tsx must render <App /> from "./App.tsx" into #root using ReactDOM.createRoot
7. Make the index.html <title> and meta description match the app being built
8. ALL string values: use double quotes, escape newlines as \\n and quotes as \\"
9. Be CONCISE — these are templates, keep them tight`;

export async function POST(request: NextRequest) {
  const { prompt = 'site de cafeteria moderna', tokens = 6000 } = await request.json();

  const messages: LLMMessage[] = [
    { role: 'system', content: BOILERPLATE_SYSTEM_PROMPT },
    { role: 'user', content: `Build boilerplate for: ${prompt}\n\nGenerate ONLY the 6 boilerplate files. The app will be: ${prompt.slice(0, 200)}` },
  ];

  try {
    const start = Date.now();
    const response = await callLLM(messages, MODELS.HAIKU, tokens);
    const elapsed = Date.now() - start;
    const content = response.content;

    // Tenta extrair JSON
    let parsed = null;
    let parseError = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      parseError = String(e);
    }

    return new Response(JSON.stringify({
      success: true,
      model: MODELS.HAIKU,
      elapsedMs: elapsed,
      contentLength: content.length,
      contentStart: content.substring(0, 300),
      contentEnd: content.substring(Math.max(0, content.length - 200)),
      usage: response.usage,
      parsed: parsed ? 'OK' : 'FAIL',
      parseError,
      filesCount: parsed?.files ? Object.keys(parsed.files).length : 0,
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: String(err),
      stack: err?.stack,
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
