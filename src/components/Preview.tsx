'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
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

/**
 * Stub para ícones do lucide-react
 * Mapeia nomes comuns pra emoji/SVG inline
 */
const LUCIDE_ICONS: Record<string, string> = {
  Sun: '☀️', Moon: '🌙', Zap: '⚡', TrendingUp: '📈', TrendingDown: '📉',
  Shield: '🛡️', ShieldCheck: '🛡️', Users: '👥', User: '👤', UserPlus: '➕',
  ArrowRight: '→', ArrowLeft: '←', ArrowUp: '↑', ArrowDown: '↓',
  Menu: '☰', X: '✕', Check: '✓', CheckCircle: '✓', CheckCircle2: '✓',
  Star: '★', Heart: '♥', Mail: '✉️', Phone: '📞', MapPin: '📍',
  Sparkles: '✨', Code: '⌨️', Wand2: '🪄', Rocket: '🚀', Globe: '🌐',
  Play: '▶️', Search: '🔍', Clock: '🕐', Calendar: '📅', Bell: '🔔',
  Settings: '⚙️', Lock: '🔒', Unlock: '🔓', Eye: '👁️', EyeOff: '👁️‍🗨️',
  Camera: '📷', Video: '🎥', Image: '🖼️', Music: '🎵', Mic: '🎤',
  Coffee: '☕', Briefcase: '💼', DollarSign: '💲', CreditCard: '💳',
  Github: '🐙', Twitter: '🐦', Linkedin: '💼', Facebook: '📘', Instagram: '📷',
  TrendingUp2: '📈', Activity: '📊', BarChart: '📊', BarChart3: '📊', PieChart: '🥧',
  Database: '💾', Server: '🖥️', Cloud: '☁️', Cpu: '🧠', Terminal: '⌨️',
  Award: '🏆', Trophy: '🏆', Target: '🎯', Flag: '🚩', Bookmark: '🔖',
  Home: '🏠', Building: '🏢', Factory: '🏭', Store: '🏪', Package: '📦',
  Truck: '🚚', Plane: '✈️', Ship: '🚢', Bike: '🚲', Car: '🚗',
  Leaf: '🍃', Flame: '🔥', Droplet: '💧', Snowflake: '❄️', Wind: '💨',
  Lightbulb: '💡', Battery: '🔋', Power: '⚡', Plug: '🔌', Wifi: '📶',
  Download: '⬇️', Upload: '⬆️', Share: '↗️', Share2: '↗️', Link: '🔗',
  Plus: '➕', Minus: '➖', Edit: '✏️', Trash: '🗑️', Save: '💾',
  Copy: '📋', Scissors: '✂️', Paperclip: '📎', Filter: '🔍', Sort: '🔢',
  ChevronRight: '›', ChevronLeft: '‹', ChevronUp: '⌃', ChevronDown: '⌄',
  MoreHorizontal: '⋯', MoreVertical: '⋮', Grid: '▦', List: '☰',
  Layers: '▤', Box: '⬜', Inbox: '📥', Send: '➤', MessageCircle: '💬',
  MessageSquare: '💬', PhoneCall: '📞', Voicemail: '🎙️', Hash: '#', AtSign: '@',
};

/**
 * Converte uma string JSX em HTML estático simples
 * (NÃO é perfeito, mas funciona para preview básico)
 */
function buildPreviewHtml(files: Record<string, string>): string {
  // Encontra o App.tsx ou page.tsx principal
  const appFile = files['src/App.tsx'] || files['app/page.tsx'] || files['App.tsx'] || '';
  const cssFile = files['src/index.css'] || files['app/globals.css'] || files['index.css'] || '';

  if (!appFile) {
    return buildPlaceholderHtml(files);
  }

  // Extrai CSS custom (sem @tailwind)
  const customCss = cssFile
    .replace(/@tailwind[^;]*;/g, '')
    .replace(/@import[^;]*;/g, '')
    .trim();

  // Remove imports e exports - injeta direto
  let jsxCode = appFile
    .replace(/^["']use client["'];?/gm, '')
    .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/export\s+default\s+function\s+\w+/g, 'function App')
    .replace(/export\s+default\s+/g, '')
    .trim();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000; }
    ${customCss}
  </style>
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="env,react">
    const { useState, useEffect, useRef } = React;
    const LUCIDE_ICONS = ${JSON.stringify(LUCIDE_ICONS)};
    const Icon = ({ name, size = 24, className = '', color }) => {
      const emoji = LUCIDE_ICONS[name] || '•';
      return React.createElement('span', {
        className,
        style: { fontSize: size + 'px', lineHeight: 1, display: 'inline-flex', alignItems: 'center', color }
      }, emoji);
    };

    ${jsxCode}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(typeof App !== 'undefined' ? App : (() => React.createElement('div', { style: { padding: 20, color: 'white' } }, 'App not found'))));
  </script>
</body>
</html>`;
}

function buildPlaceholderHtml(files: Record<string, string>) {
  const fileCount = Object.keys(files).length;
  const charCount = Object.values(files).reduce((acc, f) => acc + f.length, 0);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Preview</title>
</head>
<body>
  <div class="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white flex items-center justify-center p-6">
    <div class="max-w-2xl text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium mb-6">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
        Preview ativo
      </div>
      <h1 class="text-5xl md:text-6xl font-bold mb-4">Seu app está pronto</h1>
      <p class="text-lg text-white/80 mb-8">${fileCount} arquivos · ${charCount.toLocaleString('pt-BR')} caracteres gerados</p>
      <p class="text-sm text-white/60">Vá na aba <strong>Código</strong> para ver todos os arquivos gerados.</p>
    </div>
  </div>
</body>
</html>`;
}

export function Preview() {
  const { files } = useAppStore();
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const previewHtml = useMemo(() => buildPreviewHtml(files), [files, refreshKey]);

  const refreshPreview = () => {
    setIsLoading(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setIsLoading(false), 800);
  };

  const openInNewTab = () => {
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
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
          <span className="text-white/30 ml-1">({Object.keys(files).length} arquivos)</span>
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

          <button onClick={refreshPreview} className="p-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer" title="Atualizar">
            <RefreshCw className="w-3.5 h-3.5 text-white/60" />
          </button>
          <button onClick={openInNewTab} className="p-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer" title="Abrir em nova aba">
            <ExternalLink className="w-3.5 h-3.5 text-white/60" />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer" title="Tela cheia">
            <Maximize2 className="w-3.5 h-3.5 text-white/60" />
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
            className="w-full border-0 block bg-white"
            style={{ height: '600px' }}
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-same-origin"
            title="App Preview"
          />
        </div>
      </div>
    </div>
  );
}
