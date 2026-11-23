import { Moon, Sun } from 'lucide-react';
import type { ThemeMode } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
  variant?: 'default' | 'glass';
  className?: string;
}

export function ThemeToggle({
  theme,
  onToggle,
  variant = 'default',
  className,
}: ThemeToggleProps) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className={cn(
        'min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-all active:scale-95 touch-manipulation',
        variant === 'glass'
          ? 'bg-white/20 hover:bg-white/30 text-white border border-white/25 backdrop-blur-xs'
          : 'border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300',
        className
      )}
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
}
