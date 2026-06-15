/**
 * Orchestrator - Coordena planner + coder
 * Usa LiteLLM para máxima velocidade
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
    // Phase 1: Plan (rápido com LiteLLM)
    console.log('[Orchestrator] Phase 1: Planning...');
    const plan = await planGeneration(userPrompt);
    console.log('[Orchestrator] Plan created:', plan.tasks.length, 'tasks');

    const allFiles: Record<string, string> = { ...existingFiles };

    // Phase 2: Generate for each task (paralelo para velocidade)
    console.log('[Orchestrator] Phase 2: Generating code...');

    // Gerar em batch para velocidade
    const taskResults = await Promise.all(
      plan.tasks.map(async (task) => {
        console.log('[Orchestrator] Generating:', task);
        return await generateCode(task, allFiles);
      })
    );

    // Agregar arquivos gerados
    for (const result of taskResults) {
      if (result.success && result.files) {
        Object.assign(allFiles, result.files);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log('[Orchestrator] Complete!', allFiles.length, 'files in', totalTime, 'ms');

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
      plan: { specification: '', tasks: [], estimatedComplexity: 'medium' },
      error: String(error),
    };
  }
}