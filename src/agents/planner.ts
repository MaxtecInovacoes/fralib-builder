/**
 * Planner Agent - Interpreta prompts e planeja geração
 */
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';

export interface GenerationPlan {
  specification: string;
  tasks: string[];
  estimatedComplexity: 'simple' | 'medium' | 'complex';
}

const PLANNER_SYSTEM_PROMPT = `You are a planning agent for an AI app builder.
Your job is to:
1. Understand the user's request
2. Create a detailed specification
3. Break down the work into atomic tasks

Be concise and practical. Focus on React/Next.js with Tailwind CSS.

Respond ONLY with valid JSON in this exact format:
{
  "specification": "What the app does and how",
  "tasks": ["Create package.json", "Create app/page.tsx", "Create components/..."],
  "estimatedComplexity": "simple|medium|complex"
}`;

export async function planGeneration(userPrompt: string): Promise<GenerationPlan> {
  const messages: LLMMessage[] = [
    { role: 'system', content: PLANNER_SYSTEM_PROMPT },
    { role: 'user', content: `Create a plan for this app: ${userPrompt}` },
  ];

  try {
    const response = await callLLM(messages, MODELS.HAIKU, 1024);
    const content = response.content.trim();

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          specification: parsed.specification || content,
          tasks: parsed.tasks || ['Create main app'],
          estimatedComplexity: parsed.estimatedComplexity || 'medium',
        };
      }
    } catch {
      // Fallback
    }

    const tasks = content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);

    return {
      specification: content,
      tasks: tasks.length > 0 ? tasks : ['Create app structure', 'Implement features', 'Add styling'],
      estimatedComplexity: 'medium',
    };
  } catch (error) {
    console.error('[Planner] Error:', error);
    return {
      specification: userPrompt,
      tasks: ['Create app structure'],
      estimatedComplexity: 'medium',
    };
  }
}