/**
 * LLM Integration via Proxy Namehost
 *
 * Endpoint: https://ia.namehost.com.br
 * Auth: nh_3HMKMsoj7pboc-uaMCwkdJfzadshpDvpKGiKAOEQNG4
 */

const LITELLM_BASE_URL = process.env.NEXT_PUBLIC_LITELLM_URL || 'https://ia.namehost.com.br';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || 'nh_3HMKMsoj7pboc-uaMCwkdJfzadshpDvpKGiKAOEQNG4';

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
  model: string = 'claude-sonnet-4-6',
  maxTokens: number = 8192
): Promise<LLMResponse> {
  const startTime = Date.now();

  console.log(`[LLM] Calling ${LITELLM_BASE_URL} with model ${model}`);

  try {
    const response = await fetch(`${LITELLM_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LITELLM_API_KEY}`,
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
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
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

// Modelos disponíveis no proxy
export const MODELS = {
  // Claude models
  HAIKU: 'claude-haiku-4-5',        // Rápido e barato
  SONNET: 'claude-sonnet-4-6',     // Bom custo-benefício (default)
  OPUS_47: 'claude-opus-4-7',      // Melhor qualidade
  OPUS_46: 'claude-opus-4-6',      // Ótima qualidade

  // Default
  DEFAULT: 'claude-sonnet-4-6',
} as const;

export default callLLM;