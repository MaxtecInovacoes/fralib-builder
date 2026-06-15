import { NextRequest, NextResponse } from 'next/server';
import { generateApp } from '@/agents/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const { prompt, files } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Usa LiteLLM automaticamente (não precisa de API key)
    const result = await generateApp(prompt, files || {});

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate app. Make sure LiteLLM is running.' },
      { status: 500 }
    );
  }
}