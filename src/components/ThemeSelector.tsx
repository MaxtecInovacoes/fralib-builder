'use client';

import { THEMES, type DesignTheme } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ThemeSelectorProps {
  selected: DesignTheme;
  onChange: (theme: DesignTheme) => void;
  disabled?: boolean;
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
                'w-[88px] h-[60px] overflow-hidden',
                isSelected
                  ? 'border-violet-500/60 ring-1 ring-violet-500/40'
                  : 'border-white/5 hover:border-white/15',
                disabled && 'opacity-40 cursor-not-allowed'
              )}
              title={theme.description}
            >
              {/* Mini preview do tema */}
              <div
                className="absolute inset-0 flex flex-col p-1.5"
                style={{
                  background: theme.preview.bg,
                  color: theme.preview.text,
                }}
              >
                {/* Linhas decorativas simulando conteúdo */}
                <div className="flex items-center gap-1 mb-1">
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ background: theme.preview.accent }}
                  />
                  <div
                    className="h-1 flex-1 rounded-full opacity-40"
                    style={{ background: theme.preview.text }}
                  />
                </div>
                <div
                  className="h-1.5 w-3/4 rounded-sm mb-1"
                  style={{ background: theme.preview.text }}
                />
                <div
                  className="h-1 w-full rounded-full opacity-30 mb-0.5"
                  style={{ background: theme.preview.text }}
                />
                <div
                  className="h-1 w-2/3 rounded-full opacity-30"
                  style={{ background: theme.preview.text }}
                />
                <div className="flex-1" />
                <div className="flex gap-1">
                  <div
                    className="h-2 w-6 rounded-sm"
                    style={{ background: theme.preview.accent }}
                  />
                  <div
                    className="h-2 w-6 rounded-sm opacity-40"
                    style={{ background: theme.preview.text }}
                  />
                </div>
              </div>

              {/* Indicador de seleção */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-violet-500 flex items-center justify-center shadow-md shadow-violet-500/40">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}
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
