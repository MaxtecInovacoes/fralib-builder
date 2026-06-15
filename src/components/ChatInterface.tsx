'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Bot, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateApp } from '@/agents/orchestrator';

export function ChatInterface() {
  const { messages, addMessage, isGenerating, setGenerating, setFiles } = useAppStore();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setGenerating(true);
    setStatus('🤖 Analisando seu pedido...');
    addMessage({
      id: generateId(),
      role: 'assistant',
      content: '🤖 Analisando seu pedido...',
      timestamp: new Date(),
    });

    try {
      // Chamar orchestrator (usa LiteLLM automaticamente)
      setStatus('📝 Criando especificação...');
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: '📝 Criando especificação do projeto...',
        timestamp: new Date(),
      });

      setStatus('⚡ Gerando código com LiteLLM (ultra rápido!)...');
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: '⚡ Gerando código... (usando LiteLLM para máxima velocidade)',
        timestamp: new Date(),
      });

      const result = await generateApp(input);

      if (result.success) {
        setStatus('✅ App gerado com sucesso!');
        addMessage({
          id: generateId(),
          role: 'assistant',
          content: `✅ **App gerado com sucesso!**\n\n📁 **${Object.keys(result.files).length} arquivos criados**\n\nPlano: ${result.plan.specification}\n\nVerifique o **Editor de Código** para ver/modificar os arquivos e o **Preview** para ver o resultado.`,
          timestamp: new Date(),
        });

        // Atualizar arquivos no store
        setFiles(result.files);
      } else {
        setStatus('❌ Erro na geração');
        addMessage({
          id: generateId(),
          role: 'assistant',
          content: `❌ Erro: ${result.error || 'Falha ao gerar app'}. Tente novamente.`,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      setStatus('❌ Erro');
      addMessage({
        id: generateId(),
        role: 'assistant',
        content: `❌ Erro: ${error instanceof Error ? error.message : 'Falha desconhecida'}. Verifique se o LiteLLM está rodando.`,
        timestamp: new Date(),
      });
    } finally {
      setGenerating(false);
      setStatus('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      {status && (
        <div className="p-2 bg-blue-600/20 border-b border-blue-600/30 flex items-center gap-2 text-blue-400 text-sm">
          <Zap className="w-4 h-4 animate-pulse" />
          {status}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">AI App Builder</p>
            <p className="text-sm mt-2">Descreva o app que você quer criar</p>
            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <p>Exemplos:</p>
              <p>"Landing page para startup fintech"</p>
              <p>"Dashboard de analytics com gráficos"</p>
              <p>"App de tarefas com autenticação"</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-4 py-3',
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-900">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Descreva o app que você quer criar..."
            className="min-h-[60px] bg-gray-800 border-gray-700 text-white resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Powered by LiteLLM ⚡ | Enter para enviar, Shift+Enter para nova linha
        </p>
      </form>
    </div>
  );
}