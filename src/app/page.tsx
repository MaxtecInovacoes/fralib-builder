'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { ChatInterface } from '@/components/ChatInterface';
import { CodeEditor } from '@/components/CodeEditor';
import { Preview } from '@/components/Preview';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Bot,
  Code2,
  Eye,
  Menu,
  X,
  Sparkles,
  Zap,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type View = 'chat' | 'code' | 'preview';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { files, isGenerating } = useAppStore();

  const navItems = [
    { id: 'chat' as const, label: 'Chat', icon: Bot },
    { id: 'code' as const, label: 'Código', icon: Code2 },
    { id: 'preview' as const, label: 'Preview', icon: Eye },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AI App Builder</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-full text-sm">
              <Zap className="w-4 h-4 animate-pulse" />
              Gerando...
            </div>
          )}
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Deploy
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside
          className={cn(
            'hidden md:flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300',
            sidebarOpen ? 'w-80' : 'w-0'
          )}
        >
          {sidebarOpen && (
            <>
              {/* Feature highlights */}
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Recursos
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                    <Bot className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium">Geração por IA</p>
                      <p className="text-xs text-gray-500">Descreva e gere apps</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                    <Code2 className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium">Editor de Código</p>
                      <p className="text-xs text-gray-500">Edite o código gerado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium">Preview em Tempo Real</p>
                      <p className="text-xs text-gray-500">Veja as mudanças</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Projeto Atual
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-white">{Object.keys(files).length}</p>
                    <p className="text-xs text-gray-500">Arquivos</p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-white">
                      {Object.values(files).reduce((acc, f) => acc + f.length, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Linhas</p>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="p-4 flex-1">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Ações Rápidas
                </h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Layers className="w-4 h-4 mr-2" />
                    Novo Projeto
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Code2 className="w-4 h-4 mr-2" />
                    Templates
                  </Button>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 min-h-0 border-t border-gray-800">
                <ChatInterface />
              </div>
            </>
          )}
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as View)}>
            <TabsList className="w-full grid grid-cols-3 bg-gray-900">
              {navItems.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="flex flex-col items-center gap-1 py-3"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Main panels */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop tabs */}
          <div className="hidden md:flex border-b border-gray-800 bg-gray-900/50">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as View)}>
              <TabsList className="bg-transparent h-auto p-0">
                {navItems.map((item) => (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-gray-900/50',
                      activeView === item.id && 'text-blue-400'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeView} className="h-full">
              <TabsContent value="chat" className="h-full m-0">
                <div className="md:hidden h-full">
                  <ChatInterface />
                </div>
              </TabsContent>
              <TabsContent value="code" className="h-full m-0">
                <CodeEditor />
              </TabsContent>
              <TabsContent value="preview" className="h-full m-0">
                <Preview />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Spacer for mobile tabs */}
      <div className="md:hidden h-16" />
    </div>
  );
}
