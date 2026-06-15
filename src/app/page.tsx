'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { ChatInterface } from '@/components/ChatInterface';
import { CodeEditor } from '@/components/CodeEditor';
import { Preview } from '@/components/Preview';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Code2,
  Eye,
  Sparkles,
  Zap,
  Folder,
  Rocket,
  Settings,
  Share2,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

type View = 'chat' | 'code' | 'preview';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { files, isGenerating } = useAppStore();

  const navItems = [
    { id: 'chat' as const, label: 'Chat', icon: Bot, shortcut: '1' },
    { id: 'code' as const, label: 'Código', icon: Code2, shortcut: '2' },
    { id: 'preview' as const, label: 'Preview', icon: Eye, shortcut: '3' },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '1') setActiveView('chat');
        if (e.key === '2') setActiveView('code');
        if (e.key === '3') setActiveView('preview');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden font-sans">
      {/* Header - estilo Lovable */}
      <header className="h-14 flex-shrink-0 bg-[#0f0f17]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] leading-tight">Maxtec's Lovable</span>
              <span className="text-[11px] text-white/40 leading-tight">AI App Builder</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-full text-xs font-medium">
              <div className="relative">
                <Zap className="w-3.5 h-3.5" />
                <span className="absolute inset-0 animate-ping">
                  <Zap className="w-3.5 h-3.5 opacity-50" />
                </span>
              </div>
              Gerando...
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Compartilhar
          </Button>

          <Button
            size="sm"
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0 shadow-lg shadow-violet-500/25 cursor-pointer"
          >
            <Rocket className="w-4 h-4 mr-1.5" />
            Publicar
          </Button>

          <button
            className="p-1.5 hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'flex-shrink-0 flex flex-col bg-[#0f0f17] border-r border-white/5 transition-all duration-300 ease-out',
            sidebarCollapsed ? 'w-0 md:w-12' : 'w-full md:w-80 lg:w-96'
          )}
        >
          {!sidebarCollapsed && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Projects section */}
              <div className="p-3 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2">
                    Projetos
                  </h3>
                  <button
                    className="p-1 hover:bg-white/5 rounded transition-colors cursor-pointer"
                    aria-label="New project"
                  >
                    <Plus className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-white/5 text-left cursor-pointer">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-violet-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Meu App</p>
                      <p className="text-[11px] text-white/40">Agora</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Files count */}
              <div className="p-3 border-b border-white/5">
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-2">
                  Projeto Atual
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2.5 bg-white/3 rounded-lg border border-white/5">
                    <p className="text-xl font-semibold text-white">{Object.keys(files).length}</p>
                    <p className="text-[11px] text-white/40">Arquivos</p>
                  </div>
                  <div className="px-3 py-2.5 bg-white/3 rounded-lg border border-white/5">
                    <p className="text-xl font-semibold text-white">
                      {Object.values(files).reduce((acc, f) => acc + f.length, 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-white/40">Caracteres</p>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 min-h-0 flex flex-col">
                <ChatInterface />
              </div>
            </div>
          )}

          {/* Collapsed sidebar - just icons */}
          {sidebarCollapsed && (
            <div className="hidden md:flex flex-col items-center gap-2 p-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setSidebarCollapsed(false);
                  }}
                  className="p-2.5 hover:bg-white/5 rounded-md transition-colors cursor-pointer"
                  aria-label={item.label}
                  title={item.label}
                >
                  <item.icon className="w-4 h-4 text-white/60" />
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main panel */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0f]">
          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-white/5 bg-[#0f0f17]/40 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4">
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as View)}>
                <TabsList className="bg-transparent h-12 p-0 gap-1">
                  {navItems.map((item) => (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className={cn(
                        'flex items-center gap-2 px-4 h-12 rounded-none border-b-2 border-transparent cursor-pointer',
                        'text-white/60 hover:text-white/90 data-[state=active]:text-white',
                        'data-[state=active]:border-violet-400 data-[state=active]:bg-transparent',
                        'transition-all duration-200'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                      <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.5 text-[10px] text-white/30 bg-white/5 rounded">
                        ⌘{item.shortcut}
                      </kbd>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* View actions */}
              <div className="flex items-center gap-1.5">
                {activeView === 'preview' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Ver ao vivo
                  </Button>
                )}
                {activeView === 'code' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 mr-1.5" />
                    {Object.keys(files).length} arquivos
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeView === 'chat' && <ChatInterface />}
            {activeView === 'code' && <CodeEditor />}
            {activeView === 'preview' && <Preview />}
          </div>
        </main>
      </div>

      {/* Status bar - estilo Lovable */}
      <div className="h-7 flex-shrink-0 bg-[#0f0f17] border-t border-white/5 flex items-center justify-between px-3 text-[11px] text-white/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Conectado</span>
          </div>
          <span>·</span>
          <span>Claude Sonnet 4.6</span>
        </div>
        <div className="flex items-center gap-3">
          <span>0 mensagens</span>
          <span>·</span>
          <span>Pronto</span>
        </div>
      </div>
    </div>
  );
}