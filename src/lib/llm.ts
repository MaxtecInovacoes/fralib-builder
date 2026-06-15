/**
 * LLM Integration via LiteLLM
 *
 * Endpoint: Tailscale network - http://100.126.121.54:4000
 */

const LITELLM_BASE_URL = process.env.NEXT_PUBLIC_LITELLM_URL || 'http://100.126.121.54:4000';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callLLM(
  messages: LLMMessage[],
  model: string = 'fralib-fast-cheap',
  maxTokens: number = 8192
): Promise<LLMResponse> {
  const startTime = Date.now();

  console.log(`[LLM] Calling ${LITELLM_BASE_URL} with model ${model}`);

  try {
    const response = await fetch(`${LITELLM_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LITELLM_API_KEY && {
          'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
        }),
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LLM] Error ${response.status}:`, errorText);
      throw new Error(`LiteLLM error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    console.log(`[LLM] ✓ ${model} | ${latency}ms | ${data.usage?.total_tokens || 0} tokens`);

    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage,
    };
  } catch (error) {
    console.error('[LLM] Error:', error);
    throw error;
  }
}

// Modelos disponíveis ( LiteLLM)
export const MODELS = {
  // Fast & Cheap - tarefas simples
  FAST: 'fralib-fast-cheap',

  // Code generation
  CODE: 'fralib-builder-strong',

  // Agent - tarefas complexas
  AGENT: 'fralib-agent-balanced',

  // JSON repair
  JSON: 'fralib-json-repair',
} as const;

export default callLLM;