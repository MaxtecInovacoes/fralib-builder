/**
 * Orchestrator - Coordena planner + coder
 * Estratégia otimizada pro Vercel (10s timeout):
 * - Planner gera 3-6 tasks
 * - Roda em batches paralelos pequenos (2 por vez)
 * - Cada coder tem max_tokens=4096 pra ser rápido
 */
import { planGeneration } from './planner';
import { generateCode } from './coder';
import type { GenerationPlan } from './types';

export interface OrchestratorResult {
  success: boolean;
  files: Record<string, string>;
  plan: GenerationPlan;
  error?: string;
}

/**
 * Roda tasks em batches paralelos pequenos
 */
async function runBatches<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  batchSize: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(worker));
    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.push(r.value);
      else results.push(null as any);
    }
  }
  return results;
}

export async function generateApp(
  userPrompt: string,
  existingFiles: Record<string, string> = {}
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  console.log('[Orchestrator] Starting generation for:', userPrompt);

  try {
    // Phase 1: Plan (rápido)
    console.log('[Orchestrator] Phase 1: Planning...');
    const plan = await planGeneration(userPrompt);
    console.log('[Orchestrator] Plan created:', plan.tasks.length, 'tasks |', plan.estimatedComplexity);

    if (!plan.tasks || plan.tasks.length === 0) {
      throw new Error('Planner returned no tasks');
    }

    const allFiles: Record<string, string> = { ...existingFiles };

    // Phase 2: Code (em batches de 2)
    console.log('[Orchestrator] Phase 2: Generating code (batches of 2)...');

    const results = await runBatches(
      plan.tasks,
      async (task) => {
        const i = plan.tasks.indexOf(task);
        console.log(`[Orchestrator] [${i + 1}/${plan.tasks.length}] ${task.slice(0, 70)}...`);
        return await generateCode(task, allFiles);
      },
      2 // batch size
    );

    let successCount = 0;
    for (const result of results) {
      if (result && result.success && result.files) {
        Object.assign(allFiles, result.files);
        successCount++;
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Orchestrator] Complete! ${successCount}/${plan.tasks.length} ok | ${Object.keys(allFiles).length} files | ${totalTime}ms`);

    if (Object.keys(allFiles).length === 0) {
      return {
        success: false,
        files: {},
        plan,
        error: 'Nenhum arquivo foi gerado. O LLM pode estar temporariamente fora. Tente novamente.',
      };
    }

    return {
      success: true,
      files: allFiles,
      plan,
    };
  } catch (error) {
    console.error('[Orchestrator] Error:', error);
    return {
      success: false,
      files: {},
      plan: { specification: userPrompt, tasks: [], estimatedComplexity: 'medium' },
      error: String(error),
    };
  }
}
