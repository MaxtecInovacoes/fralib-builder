import { NextRequest, NextResponse } from 'next/server';
import { generateApp } from '@/agents/orchestrator';

// Configuração de runtime: edge pra ser mais rápido, ou nodejs com timeout
export const runtime = 'nodejs';
export const maxDuration = 60; // 60s (Vercel Pro). Hobby = 10s.

export async function POST(request: NextRequest) {
  try {
    const { prompt, files } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await generateApp(prompt, files || {});

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate app. Try again in a moment.' },
      { status: 500 }
    );
  }
}
