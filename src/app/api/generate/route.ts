import { NextRequest } from 'next/server';
import { fastGenerate } from '@/agents/fast-generator';

export const runtime = 'nodejs';
// Vercel Pro = 60s, Hobby = 10s
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { prompt, files } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Estratégia: 1 chamada LLM (rápido, cabe no timeout do Vercel)
    const result = await fastGenerate(prompt);

    return new Response(
      JSON.stringify({
        success: result.success,
        files: result.files,
        plan: {
          specification: result.specification,
          tasks: Object.keys(result.files),
          estimatedComplexity: Object.keys(result.files).length > 2 ? 'medium' : 'simple',
        },
        error: result.error,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate app. Try again in a moment.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
