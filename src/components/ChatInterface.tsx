'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from '@/components/ThemeSelector';
import { DEFAULT_THEME, type DesignTheme } from '@/lib/themes';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Plus,
  Wand2,
  Code,
  Zap,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';


const SUGGESTIONS = [
  {
    icon: Wand2,
    title: 'Landing page moderna',
    description: 'para um SaaS de produtividade',
  },
  {
    icon: Code,
    title: 'Dashboard analítico',
    description: 'com gráficos e tabelas',
  },
  {
    icon: Sparkles,
    title: 'Portfólio criativo',
    description: 'para designer freelancer',
  },
  {
    icon: Zap,
    title: 'App de tarefas',
    description: 'com autenticação e DB',
  },
];

export function ChatInterface() {
  const { messages, addMessage, isGenerating, setGenerating, setFiles } = useAppStore();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<string>('');
  const [elapsed, setElapsed] = useState(0);
  const [progressFiles, setProgressFiles] = useState<{ name: string; status: 'pending' | 'done' }[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<DesignTheme>(DEFAULT_THEME);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, progressFiles, status]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Timer que conta segundos durante a geração
  useEffect(() => {
    if (!isGenerating) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSubmit = async (prompt?: string) => {
    const finalPrompt = (prompt || input).trim();
    if (!finalPrompt || isGenerating) return;

    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: finalPrompt,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setGenerating(true);
    setProgressFiles([]);
    setStatus('Iniciando...');

    try {
      const res = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, theme: selectedTheme.prompt }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalFiles: Record<string, string> = {};
      let errorMsg: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE: eventos separados por \n\n
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // mantém o último parcial

        for (const evt of events) {
          const lines = evt.split('\n');
          let eventType = 'message';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataStr += line.slice(6);
          }
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            switch (eventType) {
              case 'start':
                setStatus('Iniciando geração...');
                break;
              case 'thinking':
                setStatus(data.message || 'Pensando...');
                break;
              case 'planning':
                setStatus(data.message || 'Planejando...');
                break;
              case 'connecting':
                setStatus(data.message || 'Conectando à IA...');
                break;
              case 'generating':
                setStatus(data.message || 'Gerando código...');
                // Inicializa lista de arquivos esperados
                if (progressFiles.length === 0) {
                  setProgressFiles([
                    { name: 'app/layout.tsx', status: 'pending' },
                    { name: 'app/page.tsx', status: 'pending' },
                    { name: 'app/globals.css', status: 'pending' },
                  ]);
                }
                break;
              case 'file':
                setProgressFiles(prev => {
                  const next = [...prev];
                  const idx = next.findIndex(f => f.name === data.file);
                  if (idx >= 0) next[idx] = { ...next[idx], status: 'done' };
                  return next;
                });
                setStatus(`✓ ${data.file} criado (${data.index}/${data.total})`);
                break;
              case 'parsing':
                setStatus(data.message || 'Processando...');
                break;
              case 'done':
                if (data.files) finalFiles = data.files;
                setStatus(`Pronto em ${Math.floor((data.durationMs || 0) / 1000)}s!`);
                break;
              case 'error':
                errorMsg = data.error || 'Erro desconhecido';
                break;
            }
          } catch (parseErr) {
            console.warn('SSE parse error:', parseErr, dataStr.slice(0, 100));
          }
        }
      }

      if (errorMsg) {
        addMessage({
          id: generateId(),
          role: 'assistant',
          content: `❌ ${errorMsg}. Tente reformular o prompt.`,
          timestamp: new Date(),
        });
      } else if (Object.keys(finalFiles).length > 0) {
        const fileCount = Object.keys(finalFiles).length;
        addMessage({
          id: generateId(),
          role: 'assistant',
          content: `Pronto! Criei **${fileCount} arquivos** para você em ${elapsed}s. Veja na aba **Código** ou no **Preview** para conferir.`,
          timestamp: new Date(),
        });
        setFiles(finalFiles);
      } else {
        addMessage({
          id: generateId(),
          role: 'assistant',
          content: `❌ Não consegui gerar arquivos. Tente reformular o prompt.`,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `❌ Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}. Tente novamente.`,
        timestamp: new Date(),
      });
    } finally {
      setGenerating(false);
      setStatus('');
      setProgressFiles([]);
    }
  };

  const handleSuggestion = (suggestion: { title: string; description: string }) => {
    handleSubmit(`Cria ${suggestion.title} ${suggestion.description}`);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f17]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">O que vamos criar, Maxtec?</h2>
            <p className="text-sm text-white/50 mb-6 max-w-xs">
              Descreva seu app e a IA gera o código completo em segundos.
            </p>

            {/* Suggestions grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(s)}
                  disabled={isGenerating}
                  className="group text-left p-3 rounded-lg bg-white/3 hover:bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-violet-500/10 group-hover:bg-violet-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                      <s.icon className="w-3.5 h-3.5 text-violet-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.title}</p>
                      <p className="text-[11px] text-white/40 truncate">{s.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/20">
                    <Bot className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20'
                      : 'bg-white/5 text-white/90 border border-white/5'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-white/80" strokeWidth={2.5} />
                  </div>
                )}
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 min-w-[280px] max-w-md">
                  {/* Status + timer estilo Lovable */}
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                    <span className="text-xs text-white/50 font-mono">Running for {elapsed}s</span>
                  </div>
                  <p className="text-sm text-white/80 mb-2">{status}</p>

                  {/* Lista de arquivos sendo criados (estilo Gemini) */}
                  {progressFiles.length > 0 && (
                    <div className="space-y-1 mt-2 border-t border-white/5 pt-2">
                      {progressFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {f.status === 'done' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                          )}
                          <span className={cn(
                            'font-mono',
                            f.status === 'done' ? 'text-white/70' : 'text-white/40'
                          )}>
                            {f.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-white/5 bg-[#0a0a0f]">
        <ThemeSelector
          selected={selectedTheme}
          onChange={setSelectedTheme}
          disabled={isGenerating}
        />
        <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-violet-500/40 focus-within:bg-white/[0.07] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Peça ao Lovable para criar um aplicativo..."
            rows={1}
            disabled={isGenerating}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-white placeholder-white/30 max-h-[200px] py-1.5"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            disabled={!input.trim() || isGenerating}
            onClick={() => handleSubmit()}
            className={cn(
              'p-2 rounded-lg transition-all duration-200 flex-shrink-0',
              'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/30',
              'hover:from-violet-600 hover:to-fuchsia-600 cursor-pointer',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
            )}
            aria-label="Enviar"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-white/30 mt-1.5 px-1">
          <kbd className="px-1 py-0.5 bg-white/5 rounded text-[9px]">Enter</kbd> para enviar · <kbd className="px-1 py-0.5 bg-white/5 rounded text-[9px]">Shift+Enter</kbd> nova linha
        </p>
      </div>
    </div>
  );
}