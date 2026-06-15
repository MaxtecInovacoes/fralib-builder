/**
 * Planner Agent - Interpreta prompts e planeja geração
 */
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';

export interface GenerationPlan {
  specification: string;
  tasks: string[];
  estimatedComplexity: 'simple' | 'medium' | 'complex';
}

const PLANNER_SYSTEM_PROMPT = `You are a planning agent for an AI app builder (like Lovable/AI Studio).
Your job is to break down the user's request into atomic, concrete file-creation tasks.

CRITICAL RULES:
- Generate between 3-6 tasks MAX (not more). The system has tight time limits.
- Each task must produce ONE specific, complete file
- Order tasks logically: config first, layout/global, then components, then page
- Use Next.js 14+ App Router with TypeScript and Tailwind CSS
- For a typical landing page, generate: app/page.tsx, app/layout.tsx, components/Hero.tsx, components/Features.tsx, app/globals.css
- For a typical dashboard: app/page.tsx, components/Sidebar.tsx, components/StatsCard.tsx, app/globals.css
- Be PRAGMATIC: prefer generating 1 comprehensive page.tsx with multiple sections inline rather than many small components

Output ONLY a valid JSON object (no markdown, no commentary):
{
  "specification": "Concise description of what will be built",
  "tasks": ["Create app/layout.tsx with metadata and fonts", "Create app/page.tsx with hero/features/CTA/footer sections", "Create app/globals.css with custom styles"],
  "estimatedComplexity": "simple|medium|complex"
}`;

/**
 * Extrai JSON de uma resposta que pode ter markdown fences ou texto extra
 */
function extractJSON(text: string): any {
  // 1) Tenta parsear direto
  try {
    return JSON.parse(text);
  } catch {}

  // 2) Tenta extrair de ```json ... ```
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }

  // 3) Tenta pegar o primeiro objeto JSON balanceado
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
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {}
    }
  }

  return null;
}

export async function planGeneration(userPrompt: string): Promise<GenerationPlan> {
  const messages: LLMMessage[] = [
    { role: 'system', content: PLANNER_SYSTEM_PROMPT },
    { role: 'user', content: `Create a detailed plan for this app: ${userPrompt}` },
  ];

  try {
    const response = await callLLM(messages, MODELS.SONNET, 2048);
    const content = response.content.trim();
    console.log('[Planner] Raw response length:', content.length);

    const parsed = extractJSON(content);
    if (parsed && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
      return {
        specification: parsed.specification || userPrompt,
        tasks: parsed.tasks,
        estimatedComplexity: parsed.estimatedComplexity || 'medium',
      };
    }

    console.warn('[Planner] Failed to extract JSON, using fallback');
    return {
      specification: userPrompt,
      tasks: [
        'Create package.json with Next.js 14, TypeScript, Tailwind CSS',
        'Create app/layout.tsx with metadata and global styles',
        'Create app/globals.css with custom animations and base styles',
        'Create app/page.tsx main landing page with hero, features, and CTA sections',
        'Create components/Header.tsx with responsive navigation',
        'Create components/Footer.tsx with links and contact info',
        'Create components/ui/Button.tsx reusable button component',
      ],
      estimatedComplexity: 'medium',
    };
  } catch (error) {
    console.error('[Planner] Error:', error);
    return {
      specification: userPrompt,
      tasks: [
        'Create app/page.tsx main landing page with hero, features, and CTA sections',
        'Create app/layout.tsx with metadata',
        'Create app/globals.css with custom styles',
      ],
      estimatedComplexity: 'medium',
    };
  }
}
