/**
 * Coder Agent - Gera código React/Next.js
 */
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';
import type { AgentResponse } from './types';

const CODER_SYSTEM_PROMPT = `You are an expert full-stack developer building a Next.js 14+ App Router project.

Generate COMPLETE, RUNNABLE code for the requested task. Every file you produce must be:
- Complete (no placeholders like "// TODO" or "// rest of code here")
- Self-contained (all imports at top)
- Syntactically valid TypeScript/TSX
- Styled with Tailwind CSS utility classes
- Use 'use client' for interactive components

CRITICAL: Return ONLY a JSON object (no markdown fences, no commentary outside JSON):
{
  "files": {
    "app/page.tsx": "complete file content with all imports and export default",
    "components/Hero.tsx": "complete file content",
    "app/globals.css": "complete css"
  }
}

The file paths must be relative to the project root (e.g., "app/page.tsx", "components/Header.tsx").
The file contents must be the COMPLETE file, not snippets.`;

/**
 * Extrai JSON de uma resposta (com ou sem markdown fences)
 */
function extractJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {}

  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }

  const start = text.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    let end = -1;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end !== -1) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch {}
    }
  }
  return null;
}

/**
 * Valida se uma key parece path de arquivo
 */
function looksLikeFilePath(key: string): boolean {
  return /^[\w\-./]+\.[a-z]{1,5}$/i.test(key) && !key.startsWith('//');
}

export async function generateCode(
  task: string,
  context: Record<string, string> = {}
): Promise<AgentResponse> {
  // Limita o contexto pra não estourar tokens (pega só primeiros 2k chars de cada arquivo)
  const contextStr = Object.entries(context)
    .slice(0, 10)
    .map(([path, content]) => {
      const truncated = content.length > 2000 ? content.slice(0, 2000) + '\n// ... (truncated)' : content;
      return `// File: ${path}\n${truncated}`;
    })
    .join('\n\n---\n\n');

  const prompt = `Task: ${task}

${contextStr ? `Existing project context (use to maintain consistency):\n${contextStr}\n` : ''}
Generate the complete code for this task. Return as JSON: {"files": {"path/to/file.tsx": "complete file content"}}.`;

  try {
    const messages: LLMMessage[] = [
      { role: 'system', content: CODER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    const response = await callLLM(messages, MODELS.SONNET, 8192);
    const content = response.content.trim();
    console.log(`[Coder] Response for "${task}": ${content.length} chars`);

    const parsed = extractJSON(content);

    if (parsed && typeof parsed === 'object') {
      // Caso 1: tem "files" key
      if (parsed.files && typeof parsed.files === 'object') {
        const files: Record<string, string> = {};
        for (const [path, val] of Object.entries(parsed.files)) {
          if (typeof val === 'string' && val.length > 10) {
            files[path] = val;
          }
        }
        if (Object.keys(files).length > 0) {
          console.log(`[Coder] ✓ ${Object.keys(files).length} files generated for "${task}"`);
          return { success: true, files };
        }
      }

      // Caso 2: as próprias keys são paths de arquivo
      const fileEntries = Object.entries(parsed).filter(([k, v]) =>
        looksLikeFilePath(k) && typeof v === 'string' && v.length > 10
      );
      if (fileEntries.length > 0) {
        const files: Record<string, string> = {};
        for (const [k, v] of fileEntries) files[k] = v as string;
        console.log(`[Coder] ✓ ${files.length} files (loose) for "${task}"`);
        return { success: true, files };
      }
    }

    console.warn(`[Coder] No valid JSON/files for "${task}"`);
    return { success: false, content, error: 'No files extracted' };
  } catch (error) {
    console.error('[Coder] Error:', error);
    return { success: false, error: String(error) };
  }
}
