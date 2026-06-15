'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportSizes: Record<ViewportSize, { width: number; label: string }> = {
  desktop: { width: 100, label: 'Desktop' },
  tablet: { width: 768, label: 'Tablet' },
  mobile: { width: 375, label: 'Mobile' },
};

export function Preview() {
  const { files } = useAppStore();
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const generatePreviewHtml = () => {
    const tailwind = `<script src="https://cdn.tailwindcss.com"></script>`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${tailwind}
  <title>Preview</title>
</head>
<body>
  <div class="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white flex items-center justify-center p-6">
    <div class="max-w-2xl text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium mb-6">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
        Preview ativo
      </div>
      <h1 class="text-5xl md:text-6xl font-bold mb-4 leading-tight">Seu app está pronto</h1>
      <p class="text-lg md:text-xl text-white/80 mb-8">Use o chat para pedir modificações ou veja o código na aba Código.</p>
      <div class="flex flex-wrap gap-3 justify-center">
        <button class="px-6 py-3 bg-white text-violet-600 rounded-lg font-semibold hover:bg-white/90 transition">Ver demonstração</button>
        <button class="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition">Saiba mais</button>
      </div>
      <div class="mt-12 grid grid-cols-3 gap-4">
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div class="text-2xl font-bold">${Object.keys(files).length}</div>
          <div class="text-xs text-white/60">Arquivos</div>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div class="text-2xl font-bold">${Object.values(files).reduce((acc, f) => acc + f.length, 0)}</div>
          <div class="text-xs text-white/60">Caracteres</div>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div class="text-2xl font-bold">Pronto</div>
          <div class="text-xs text-white/60">Status</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const refreshPreview = () => {
    setIsLoading(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setIsLoading(false), 400);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const currentSize = viewportSizes[viewport];

  if (Object.keys(files).length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white/30" />
          </div>
          <p className="text-sm font-medium text-white/70">Sem preview ainda</p>
          <p className="text-xs text-white/40 mt-1">Gere um app no chat para ver o preview</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col h-full bg-[#0a0a0f]',
        isFullscreen && 'fixed inset-0 z-50'
      )}
    >
      <div className="h-10 flex-shrink-0 bg-[#0f0f17] border-b border-white/5 flex items-center justify-between px-3">
        <div className="flex items-center gap-2 text-xs text-white/60">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
          <span>Preview ao vivo</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center bg-white/3 rounded-md p-0.5 mr-1">
            {(['desktop', 'tablet', 'mobile'] as ViewportSize[]).map((size) => {
              const Icon = size === 'desktop' ? Monitor : size === 'tablet' ? Tablet : Smartphone;
              return (
                <button
                  key={size}
                  onClick={() => setViewport(size)}
                  className={cn(
                    'p-1.5 rounded transition-colors cursor-pointer',
                    viewport === size
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/80'
                  )}
                  title={viewportSizes[size].label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          <button
            onClick={refreshPreview}
            className="p-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer"
            title="Atualizar"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white/60" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer"
            title="Tela cheia"
          >
            <Maximize2 className="w-3.5 h-3.5 text-white/60" />
          </button>

          <button
            className="p-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer"
            title="Abrir em nova aba"
          >
            <ExternalLink className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#0f0f17] p-4 flex justify-center">
        <div
          className="bg-white rounded-lg shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300"
          style={{
            width: viewport === 'desktop' ? '100%' : `${currentSize.width}px`,
            maxWidth: '100%',
            height: 'fit-content',
            minHeight: '600px',
          }}
        >
          <iframe
            key={refreshKey}
            ref={iframeRef}
            className="w-full border-0 block"
            style={{ height: '600px' }}
            srcDoc={generatePreviewHtml()}
            title="App Preview"
          />
        </div>
      </div>
    </div>
  );
}