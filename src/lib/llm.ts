/**
 * LLM Integration via Proxy Namehost
 *
 * Endpoint: https://ia.namehost.com.br
 * Auth: nh_3HMKMsoj7pboc-uaMCwkdJfzadshpDvpKGiKAOEQNG4
 *
 * Tem fallback automático: tenta Tailscale (local dev) → Namehost (produção)
 */

// Em produção, SEMPRE usa Namehost (Vercel não acessa Tailscale)
const IS_PROD = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const NAMEHOST_URL = 'https://ia.namehost.com.br';
const NAMEHOST_KEY = 'nh_rSy6-2E5lkEF_fq613xz4-XhzzVkSj7gp2GUQlkniFA';

// Em prod: Namehost direto. Em dev: pode usar Tailscale (mais rápido).
// O fallback é desabilitado em prod pra não dobrar tempo de resposta.
const PRIMARY_URL = IS_PROD
  ? NAMEHOST_URL
  : (process.env.NEXT_PUBLIC_LITELLM_URL || NAMEHOST_URL);
const PRIMARY_KEY = IS_PROD
  ? NAMEHOST_KEY
  : (process.env.LITELLM_API_KEY || NAMEHOST_KEY);

// Fallback só em dev (em prod, tentar de novo não vai ajudar)
const FALLBACK_URL = NAMEHOST_URL;
const FALLBACK_KEY = 'nh_rSy6-2E5lkEF_fq613xz4-XhzzVkSj7gp2GUQlkniFA';

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

async function tryCall(
  baseUrl: string,
  apiKey: string,
  messages: LLMMessage[],
  model: string,
  maxTokens: number
): Promise<LLMResponse> {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: false,
    }),
    // Sem timeout interno - Vercel controla (Hobby: 10s, Pro: 60s)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}

export async function callLLM(
  messages: LLMMessage[],
  model: string = 'claude-haiku-4-5',
  maxTokens: number = 4096
): Promise<LLMResponse> {
  const startTime = Date.now();

  // Em produção, vai direto ao Namehost (sem tentar Tailscale)
  if (IS_PROD) {
    const result = await tryCall(PRIMARY_URL, PRIMARY_KEY, messages, model, maxTokens);
    console.log(`[LLM] ✓ ${PRIMARY_URL} | ${model} | ${Date.now() - startTime}ms`);
    return result;
  }

  // Em dev: tenta primário, fallback Namehost
  try {
    const result = await tryCall(PRIMARY_URL, PRIMARY_KEY, messages, model, maxTokens);
    console.log(`[LLM] ✓ ${PRIMARY_URL} | ${model} | ${Date.now() - startTime}ms`);
    return result;
  } catch (primaryError) {
    console.warn(`[LLM] Primary failed:`, String(primaryError).slice(0, 100));
  }

  const result = await tryCall(FALLBACK_URL, FALLBACK_KEY, messages, model, maxTokens);
  console.log(`[LLM] ✓ ${FALLBACK_URL} (fallback) | ${model} | ${Date.now() - startTime}ms`);
  return result;
}

// Modelos disponíveis no proxy
export const MODELS = {
  HAIKU: 'claude-haiku-4-5',
  SONNET: 'claude-sonnet-4-6',
  OPUS_47: 'claude-opus-4-7',
  OPUS_46: 'claude-opus-4-6',
  DEFAULT: 'claude-sonnet-4-6',
} as const;

export default callLLM;
