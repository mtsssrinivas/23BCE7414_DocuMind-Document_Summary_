import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 p-3 rounded-lg border shadow-lg transition-all text-xs font-medium ${
              isError
                ? 'bg-zinc-900 border-rose-800 text-rose-300'
                : isSuccess
                ? 'bg-zinc-900 border-emerald-800 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isError && <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
              {isSuccess && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              {!isError && !isSuccess && <Info className="h-3.5 w-3.5 text-zinc-400 shrink-0" />}
              <p className="truncate">{toast.text}</p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
