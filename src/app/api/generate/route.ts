import { NextRequest, NextResponse } from 'next/server';
import { fastGenerate } from '@/agents/fast-generator';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro = 60s, Hobby = 10s

export async function POST(request: NextRequest) {
  try {
    const { prompt, files } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Estratégia: 1 chamada LLM (rápido, cabe no timeout do Vercel)
    const result = await fastGenerate(prompt);

    return NextResponse.json({
      success: result.success,
      files: result.files,
      plan: {
        specification: result.specification,
        tasks: Object.keys(result.files),
        estimatedComplexity: Object.keys(result.files).length > 2 ? 'medium' : 'simple',
      },
      error: result.error,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate app. Try again in a moment.' },
      { status: 500 }
    );
  }
}
