/**
 * Coder Agent - Gera código React/Next.js
 * Usa LiteLLM para máxima velocidade
 */
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';
import type { AgentResponse } from './types';

const CODER_SYSTEM_PROMPT = `You are an expert React/Next.js developer. Generate clean, complete, production-ready code.

Rules:
- Use TypeScript
- Use Next.js 15 App Router conventions
- Use Tailwind CSS for styling
- Use 'use client' directive for interactive components
- Export components as default when appropriate
- Include all necessary imports
- Code must be complete and runnable
- Always wrap code in proper JSX

Generate code for the requested feature. Return as JSON:
{
  "files": {
    "path/to/file.tsx": "complete file content",
    ...
  }
}`;

export async function generateCode(
  task: string,
  context: Record<string, string>
): Promise<AgentResponse> {
  const contextStr = Object.entries(context)
    .map(([path, content]) => `// File: ${path}\n${content}`)
    .join('\n\n');

  const prompt = `Task: ${task}

Existing code context:
${contextStr}

Generate the code to complete this task. Return as JSON with the files to create or update.`;

  try {
    const messages: LLMMessage[] = [
      { role: 'system', content: CODER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    const response = await callLLM(messages, MODELS.CODE, 8192);
    const content = response.content.trim();

    // Try to extract and parse JSON
    const filesMatch = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
    if (filesMatch) {
      try {
        const parsed = JSON.parse(filesMatch[0]);
        if (parsed.files) {
          return { success: true, files: parsed.files };
        }
      } catch {
        // Try broader JSON match
      }
    }

    // Try parsing as direct files object
    const directMatch = content.match(/\{[\s\S]*\}/);
    if (directMatch) {
      try {
        const parsed = JSON.parse(directMatch[0]);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Check if it looks like files
          const hasFilePaths = Object.keys(parsed).some(k => k.includes('/'));
          if (hasFilePaths) {
            return { success: true, files: parsed };
          }
        }
      } catch {
        // Not valid JSON
      }
    }

    // Fallback: return as single file
    return { success: true, content };
  } catch (error) {
    console.error('[Coder] Error:', error);
    return { success: false, error: String(error) };
  }
}