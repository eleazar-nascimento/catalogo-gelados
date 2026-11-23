import { Delete, Lock } from 'lucide-react';
import { useState } from 'react';
import type { ThemeMode } from '../hooks/useTheme';
import { ThemeToggle } from './ui/ThemeToggle';

interface PinGateProps {
  expectedPin: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onUnlock: () => void;
  onBackToCatalog: () => void;
}

export function PinGate({
  expectedPin,
  theme,
  onToggleTheme,
  onUnlock,
  onBackToCatalog,
}: PinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError(false);

    if (next.length === 4) {
      if (next === expectedPin) {
        onUnlock();
      } else {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([80, 40, 80]);
        }
        setError(true);
        setTimeout(() => setPin(''), 450);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-xl border-2 border-slate-200 dark:border-slate-800 text-center animate-modal-in">
        <div className="absolute top-4 right-4">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>

        <div className="relative w-24 h-24 mx-auto mb-3">
          <img
            src="/dulka-logo.svg"
            alt="Logo Dulka Chup-Chup"
            className="w-24 h-24 rounded-full shadow-md"
          />
          <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow">
            <Lock className="w-4 h-4" />
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Dulka • Balcão
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
          Área da Dona Dulcineia. Digite o código de 4 números para liberar a edição.
        </p>

        <div className="flex justify-center gap-3 my-6" aria-live="polite">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-150 ${
                error
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 scale-95'
                  : pin[idx]
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 scale-105'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {pin[idx] ? '●' : ''}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-600 dark:text-red-400 font-bold text-sm mb-4 animate-fade-in">
            Código incorreto, tente novamente.
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="min-h-[60px] rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-2xl font-black text-slate-900 dark:text-white touch-manipulation transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={onBackToCatalog}
            className="min-h-[60px] rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-sm font-bold text-slate-600 dark:text-slate-300 touch-manipulation transition-all"
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="min-h-[60px] rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-2xl font-black text-slate-900 dark:text-white touch-manipulation transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Apagar número"
            className="min-h-[60px] rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 flex items-center justify-center text-slate-800 dark:text-slate-100 touch-manipulation transition-all"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </main>
  );
}
