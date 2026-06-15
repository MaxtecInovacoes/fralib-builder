'use client';

import { THEMES, type DesignTheme } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ThemeSelectorProps {
  selected: DesignTheme;
  onChange: (theme: DesignTheme) => void;
  disabled?: boolean;
}

/**
 * Mini-mockups que representam visualmente cada tema
 * Inspirado nos previews de temas do Google AI Studio
 */
function ThemeMockup({ theme }: { theme: DesignTheme }) {
  const { previewComponent, preview } = theme;

  if (previewComponent === 'typography') {
    // Bold Typography: letra gigante + barra accent
    return (
      <div
        className="absolute inset-0 flex flex-col justify-between p-2 overflow-hidden"
        style={{ background: preview.bg }}
      >
        <div
          className="text-[40px] leading-[0.7] font-black"
          style={{ color: preview.text, fontFamily: 'Inter Black, sans-serif' }}
        >
          Aa
        </div>
        <div className="flex items-center gap-1">
          <div
            className="h-1.5 w-8 rounded-sm"
            style={{ background: preview.accent }}
          />
          <div
            className="h-1 w-12 rounded-full opacity-30"
            style={{ background: preview.text }}
          />
        </div>
      </div>
    );
  }

  if (previewComponent === 'editorial') {
    // Editorial: drop cap + linhas de texto serif
    return (
      <div
        className="absolute inset-0 p-2 overflow-hidden"
        style={{ background: preview.bg }}
      >
        <div className="flex gap-1.5 h-full">
          <div
            className="text-2xl font-serif font-bold leading-none mt-0.5"
            style={{ color: preview.text, fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Q
          </div>
          <div className="flex-1 flex flex-col gap-0.5 justify-center">
            <div
              className="h-1 w-full rounded-full opacity-30"
              style={{ background: preview.text }}
            />
            <div
              className="h-1 w-3/4 rounded-full opacity-30"
              style={{ background: preview.text }}
            />
            <div
              className="h-1 w-5/6 rounded-full opacity-30"
              style={{ background: preview.text }}
            />
          </div>
        </div>
        <div
          className="absolute top-2 right-2 text-[8px] uppercase tracking-widest font-medium"
          style={{ color: preview.accent }}
        >
          Vol.01
        </div>
      </div>
    );
  }

  if (previewComponent === 'glass') {
    // Sophisticated Dark: card glassmorphism + glow
    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 50%, #16213E 100%)`,
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-8 rounded-md border backdrop-blur-md"
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(139, 92, 246, 0.3)',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.25)',
          }}
        />
        <div
          className="absolute top-1 right-1 w-2 h-2 rounded-full"
          style={{ background: '#8B5CF6', boxShadow: '0 0 6px #8B5CF6' }}
        />
        <div
          className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full opacity-60"
          style={{ background: '#EC4899' }}
        />
      </div>
    );
  }

  if (previewComponent === 'gradient') {
    // Immersive UI: gradient vibrante + orb
    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F59E0B 100%)',
        }}
      >
        <div
          className="absolute -top-3 -right-3 w-10 h-10 rounded-full blur-md opacity-70"
          style={{ background: '#F59E0B' }}
        />
        <div
          className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full blur-md opacity-60"
          style={{ background: '#A855F7' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-10 h-6 rounded-md backdrop-blur-md border"
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderColor: 'rgba(255,255,255,0.3)',
            }}
          />
        </div>
      </div>
    );
  }

  if (previewComponent === 'luxury') {
    // Elegant Dark: M serifada dourada + linhas finas
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center p-2 overflow-hidden"
        style={{ background: preview.bg }}
      >
        <div
          className="text-3xl font-serif leading-none mb-1"
          style={{ color: preview.accent, fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        >
          M
        </div>
        <div
          className="h-px w-8 mb-1"
          style={{ background: preview.accent, opacity: 0.5 }}
        />
        <div
          className="h-0.5 w-10 rounded-full"
          style={{ background: preview.text, opacity: 0.4 }}
        />
        <div
          className="absolute top-1.5 right-1.5 w-2 h-2 border"
          style={{ borderColor: preview.accent, opacity: 0.4 }}
        />
      </div>
    );
  }

  return null;
}

export function ThemeSelector({ selected, onChange, disabled }: ThemeSelectorProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
          Design theme
        </span>
        <span className="text-[10px] text-white/30">— {selected.name}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {THEMES.map((theme) => {
          const isSelected = theme.id === selected.id;
          return (
            <button
              key={theme.id}
              onClick={() => onChange(theme)}
              disabled={disabled}
              className={cn(
                'group relative flex-shrink-0 rounded-lg border transition-all duration-200',
                'w-[100px] h-[68px] overflow-hidden',
                isSelected
                  ? 'border-violet-500/60 ring-1 ring-violet-500/40 scale-[1.02]'
                  : 'border-white/10 hover:border-white/25 hover:scale-[1.02]',
                disabled && 'opacity-40 cursor-not-allowed'
              )}
              title={theme.description}
            >
              <ThemeMockup theme={theme} />

              {/* Indicador de seleção */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-violet-500 flex items-center justify-center shadow-md shadow-violet-500/40 z-10">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Label do tema na parte inferior */}
              <div
                className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider z-10"
                style={{
                  color: theme.previewComponent === 'editorial' ? theme.preview.text : '#fff',
                  background:
                    theme.previewComponent === 'editorial'
                      ? 'rgba(248, 245, 240, 0.7)'
                      : 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                  textShadow:
                    theme.previewComponent === 'editorial' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {theme.name}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-white/30 px-1 mt-1">
        {selected.description}
      </p>
    </div>
  );
}
