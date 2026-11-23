import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  variant?: 'center' | 'sheet';
  maxWidthClass?: string;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  variant = 'center',
  maxWidthClass = 'max-w-lg',
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        'fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-center animate-fade-in',
        variant === 'sheet'
          ? 'items-end sm:items-center p-0 sm:p-4'
          : 'items-center p-4'
      )}
    >
      <div
        className={cn(
          'w-full',
          maxWidthClass,
          variant === 'sheet'
            ? 'animate-sheet-in sm:animate-modal-in'
            : 'animate-modal-in'
        )}
      >
        {children}
      </div>
    </div>
  );
}
