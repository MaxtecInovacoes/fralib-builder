/**
 * Debug endpoint - mostra o que o LLM está retornando de verdade
 * Acesse: POST /api/debug com { prompt: "..." }
 */
import { NextRequest } from 'next/server';
import { callLLM, MODELS, LLMMessage } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { prompt = 'site de cafeteria moderna' } = await request.json();

  const messages: LLMMessage[] = [
    { role: 'system', content: 'Responda APENAS com um JSON válido, sem markdown, sem fences. Formato: {"ok": true, "echo": "seu prompt aqui"}' },
    { role: 'user', content: prompt },
  ];

  try {
    const response = await callLLM(messages, MODELS.HAIKU, 1000);

    return new Response(JSON.stringify({
      success: true,
      model: MODELS.HAIKU,
      contentLength: response.content.length,
      content: response.content,
      usage: response.usage,
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: String(err),
      stack: err?.stack,
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
