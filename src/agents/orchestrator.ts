/**
 * Orchestrator - Coordena planner + coder
 * Estratégia: Planner gera tasks → cada task roda em paralelo com coder → agrega arquivos
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

export async function generateApp(
  userPrompt: string,
  existingFiles: Record<string, string> = {}
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  console.log('[Orchestrator] Starting generation for:', userPrompt);

  try {
    // Phase 1: Plan
    console.log('[Orchestrator] Phase 1: Planning...');
    const plan = await planGeneration(userPrompt);
    console.log('[Orchestrator] Plan created:', plan.tasks.length, 'tasks |', plan.estimatedComplexity);

    if (!plan.tasks || plan.tasks.length === 0) {
      throw new Error('Planner returned no tasks');
    }

    const allFiles: Record<string, string> = { ...existingFiles };

    // Phase 2: Generate for each task (paralelo pra velocidade)
    console.log('[Orchestrator] Phase 2: Generating code (parallel)...');

    const taskResults = await Promise.allSettled(
      plan.tasks.map(async (task, i) => {
        console.log(`[Orchestrator] [${i + 1}/${plan.tasks.length}] Generating: ${task.slice(0, 60)}...`);
        const result = await generateCode(task, allFiles);
        return result;
      })
    );

    let successCount = 0;
    let failCount = 0;
    for (const result of taskResults) {
      if (result.status === 'fulfilled' && result.value.success && result.value.files) {
        Object.assign(allFiles, result.value.files);
        successCount++;
      } else {
        failCount++;
        if (result.status === 'rejected') {
          console.error('[Orchestrator] Task failed:', result.reason);
        } else if (result.status === 'fulfilled') {
          console.warn('[Orchestrator] Task produced no files:', result.value.error);
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Orchestrator] Complete! ${successCount} ok / ${failCount} failed | ${Object.keys(allFiles).length} files | ${totalTime}ms`);

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
