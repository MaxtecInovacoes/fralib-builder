'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Smartphone, Monitor, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportSizes: Record<ViewportSize, { width: number; label: string; icon: typeof Monitor }> = {
  desktop: { width: 100, label: 'Desktop', icon: Monitor },
  tablet: { width: 768, label: 'Tablet', icon: Smartphone },
  mobile: { width: 375, label: 'Mobile', icon: Smartphone },
};

export function Preview() {
  const { files, previewUrl } = useAppStore();
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gerar HTML preview a partir dos arquivos
  const generatePreviewHtml = () => {
    const pageContent = files['app/page.tsx'] || files['page.tsx'] || '';
    const layoutContent = files['app/layout.tsx'] || files['layout.tsx'] || '';
    const globalsContent = files['app/globals.css'] || files['globals.css'] || '';
    const tailwind = `
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
        }
      </script>
    `;

    // Parse básico do componente React para HTML
    let htmlContent = pageContent
      .replace(/import.*from.*;/g, '')
      .replace(/export default function \w+ \(\) /g, '')
      .replace(/\{/g, '{')
      .replace(/\}/g, '}')
      .replace(/<div/g, '<div')
      .replace(/<\/div>/g, '</div>')
      .replace(/<h1/g, '<h1')
      .replace(/<h2/g, '<h2')
      .replace(/<h3/g, '<h3')
      .replace(/<p/g, '<p')
      .replace(/<button/g, '<button')
      .replace(/<input/g, '<input')
      .replace(/<span/g, '<span')
      .replace(/<a href/g, '<a target="_blank" href')
      .replace(/className=/g, 'class=')
      .replace(/<img/g, '<img');

    // Simular o conteúdo
    const simulatedHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR" class="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${tailwind}
        <style>
          ${globalsContent}
          body { margin: 0; font-family: system-ui, sans-serif; }
          .min-h-screen { min-height: 100vh; }
          .bg-gradient-to-b { background: linear-gradient(to bottom, #111827, #1f2937); }
          .text-white { color: white; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          .text-center { text-align: center; }
          .text-6xl { font-size: 3.75rem; }
          .font-bold { font-weight: 700; }
          .mb-4 { margin-bottom: 1rem; }
          .text-xl { font-size: 1.25rem; }
          .text-gray-300 { color: #d1d5db; }
          .p-4 { padding: 1rem; }
          .rounded-lg { border-radius: 0.5rem; }
          .bg-blue-600 { background-color: #2563eb; }
          .text-white { color: white; }
          .hover\\:bg-blue-700:hover { background-color: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
          <div class="text-center p-8">
            <h1 class="text-6xl font-bold mb-4">Meu App</h1>
            <p class="text-xl text-gray-300 mb-6">Preview do seu app gerado</p>
            <div class="flex gap-4 justify-center">
              <button class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
                Botão de Exemplo
              </button>
              <button class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors">
                Secundário
              </button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return simulatedHtml;
  };

  const refreshPreview = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
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

  // Recarregar iframe quando arquivos mudam
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const html = generatePreviewHtml();
      iframe.srcdoc = html;
    }
  }, [files]);

  const currentSize = viewportSizes[viewport];

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col h-full bg-gray-900',
        isFullscreen && 'fixed inset-0 z-50'
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Preview</span>
          {isLoading && (
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport selector */}
          <div className="flex items-center bg-gray-900 rounded-lg p-1">
            {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => {
              const config = viewportSizes[size];
              const Icon = config.icon;
              return (
                <button
                  key={size}
                  onClick={() => setViewport(size)}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    viewport === size
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                  title={config.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPreview}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
        <div
          className="bg-white shadow-2xl transition-all duration-300"
          style={{
            width: viewport === 'desktop' ? '100%' : `${currentSize.width}px`,
            maxWidth: '100%',
          }}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full min-h-[500px] border-0"
            srcDoc={generatePreviewHtml()}
            title="App Preview"
          />
        </div>
      </div>
    </div>
  );
}
